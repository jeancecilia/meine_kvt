import OpenAI from 'openai';
import { createHash } from 'node:crypto';
import { client, ensureDatabaseReady } from '@/lib/db';

const EMBEDDING_MODEL = process.env.MEMORY_EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = Number(process.env.MEMORY_EMBEDDING_DIMENSIONS || 256);
const SYNTHESIS_MODEL = process.env.MEMORY_SYNTHESIS_MODEL || 'gpt-4o-mini';
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export type MemoryCandidate = {
  type?: 'semantic' | 'hypothesis' | 'milestone' | 'biographical' | 'preference';
  title: string;
  content: string;
  domains?: string[];
  importance?: number;
  confidence?: number;
  evidence?: string;
};

export type CorrectionCandidate = {
  incorrectClaim: string;
  correctedClaim: string;
  reason?: string;
};

export type SessionMemoryInput = {
  summaryId: string;
  sessionId: string;
  mainIssue: string;
  keyObservations?: unknown;
  interventionUsed?: string | null;
  keyInsight?: string | null;
  homework?: string | null;
  followUpTopics?: unknown;
  occurredAt?: Date | string | null;
  memoryCandidates?: MemoryCandidate[];
  corrections?: CorrectionCandidate[];
};

export type RetrievedMemory = {
  memoryKey: string;
  memoryType: string;
  title: string;
  content: string;
  domains: string[];
  importance: number;
  confidence: number;
  occurredAt: string | Date | null;
  sourceType: string | null;
  sourceId: string | null;
  sourceLabel: string | null;
  score?: number;
};

export type MemoryCorrection = {
  correctionKey: string;
  incorrectClaim: string;
  correctedClaim: string;
  reason: string | null;
  sourceType: string | null;
  sourceId: string | null;
};

export type MemoryConsolidation = {
  periodKey: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  title: string;
  summary: string;
  keyChanges: string[];
  stablePatterns: string[];
  openQuestions: string[];
  importantMemoryKeys: string[];
  sourceCount: number;
  updatedAt: string | Date;
};

let storagePromise: Promise<void> | null = null;

function clamp01(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 20);
}

function memoryText(title: string, content: string, domains: string[] = []): string {
  return [title, content, domains.length ? `Themen: ${domains.join(', ')}` : ''].filter(Boolean).join('\n');
}

const DOMAIN_TERMS: Array<[string, string[]]> = [
  ['beziehung', ['beziehung', 'partner', 'liebe', 'romant', 'dating', 'frau', 'intimit', 'einsam', 'sexuell', 'begehren']],
  ['soziale-angst', ['soziale angst', 'ansprechen', 'ablehnung', 'exposition', 'feige', 'bedrohung', 'öffentlich', 'selbstsicher']],
  ['depression', ['depress', 'melanchol', 'stimmung', 'anhedon', 'freude', 'glücklich', 'grübeln']],
  ['adhs-reward', ['adhs', 'neuheit', 'novelty', 'belohn', 'habituation', 'stimulation', 'hyperfokus']],
  ['sinn-erfuellung', ['sinn', 'erfüll', 'vollständig', 'werte', 'lebenszufriedenheit']],
  ['arbeit-leistung', ['arbeit', 'karriere', 'master', 'leistung', 'zielerreich']],
  ['sicherheit-aggression', ['gewalt', 'kampf', 'aggress', 'adrenalin', 'verteidigung', 'bedrohung']],
];

function inferDomains(text: string): string[] {
  const normalized = text.toLowerCase();
  return DOMAIN_TERMS
    .filter(([, terms]) => terms.some((term) => normalized.includes(term)))
    .map(([domain]) => domain);
}

function tokenize(text: string): Set<string> {
  const stopwords = new Set([
    'aber', 'auch', 'dass', 'dann', 'eine', 'einer', 'einem', 'einen', 'eines', 'für', 'hat', 'ich', 'ist', 'mit',
    'nicht', 'oder', 'sich', 'sie', 'und', 'von', 'war', 'wie', 'wir', 'wird', 'zu', 'zum', 'zur', 'der', 'die', 'das',
    'den', 'dem', 'des', 'ein', 'im', 'in', 'auf', 'es', 'als', 'am', 'an', 'was', 'wenn', 'mehr', 'sehr',
  ]);
  return new Set(
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9äöüß]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stopwords.has(token)),
  );
}

function lexicalSimilarity(query: string, memory: string): number {
  const queryTokens = tokenize(query);
  const memoryTokens = tokenize(memory);
  if (!queryTokens.size || !memoryTokens.size) return 0;
  let overlap = 0;
  for (const token of queryTokens) if (memoryTokens.has(token)) overlap += 1;
  return overlap / Math.sqrt(queryTokens.size * memoryTokens.size);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

function recencyScore(value: unknown): number {
  if (!value) return 0.25;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 0.25;
  const ageDays = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  return Math.exp(-ageDays / 365);
}

async function initializeStorage(): Promise<void> {
  await ensureDatabaseReady();

  // Postgres.js requires the simple-query protocol for multiple SQL statements.
  // This block contains no dynamic values and is safe to execute as one idempotent batch.
  await client`
    CREATE TABLE IF NOT EXISTS therapeutic_memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      memory_key TEXT NOT NULL UNIQUE,
      memory_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      domains JSONB DEFAULT '[]'::jsonb,
      importance NUMERIC(3,2) NOT NULL DEFAULT 0.50,
      confidence NUMERIC(3,2) NOT NULL DEFAULT 0.70,
      status TEXT NOT NULL DEFAULT 'active',
      occurred_at TIMESTAMPTZ,
      source_type TEXT,
      source_id TEXT,
      source_label TEXT,
      supersedes_memory_id UUID,
      embedding JSONB,
      embedding_model TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_sources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      memory_id UUID NOT NULL REFERENCES therapeutic_memories(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      source_id TEXT,
      source_date TIMESTAMPTZ,
      source_excerpt TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_corrections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      correction_key TEXT NOT NULL UNIQUE,
      incorrect_claim TEXT NOT NULL,
      corrected_claim TEXT NOT NULL,
      reason TEXT,
      source_type TEXT,
      source_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_consolidations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      period_key TEXT NOT NULL UNIQUE,
      period_type TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      key_changes JSONB DEFAULT '[]'::jsonb,
      stable_patterns JSONB DEFAULT '[]'::jsonb,
      open_questions JSONB DEFAULT '[]'::jsonb,
      important_memory_keys JSONB DEFAULT '[]'::jsonb,
      source_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_retrieval_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      query TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'hybrid',
      selected_memory_keys JSONB DEFAULT '[]'::jsonb,
      selected_correction_keys JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS therapeutic_memories_status_idx ON therapeutic_memories(status);
    CREATE INDEX IF NOT EXISTS therapeutic_memories_type_idx ON therapeutic_memories(memory_type);
    CREATE INDEX IF NOT EXISTS therapeutic_memories_occurred_idx ON therapeutic_memories(occurred_at DESC);
    CREATE INDEX IF NOT EXISTS therapeutic_memories_importance_idx ON therapeutic_memories(importance DESC);
    CREATE INDEX IF NOT EXISTS memory_sources_memory_idx ON memory_sources(memory_id);
    CREATE INDEX IF NOT EXISTS memory_consolidations_period_idx ON memory_consolidations(period_type, period_end DESC);
  `.simple();

  await client`
    INSERT INTO memory_corrections (
      correction_key, incorrect_claim, corrected_claim, reason, source_type, source_id, status
    ) VALUES (
      'corr-2026-08-17-now-nothing-missing',
      'Jetzt fehlt mir eigentlich gar nichts.',
      'Dieser Satz war ein Tipp-/Transkriptionsfehler und ist keine Aussage des Patienten. Er darf nicht als Selbstbericht oder therapeutische Evidenz verwendet werden.',
      'Explizite Korrektur des Patienten während der fokussierten Sitzung am 17.08.2026.',
      'session_summary',
      '00000000-0000-4000-8000-000000000818',
      'active'
    )
    ON CONFLICT (correction_key) DO UPDATE SET
      corrected_claim = EXCLUDED.corrected_claim,
      reason = EXCLUDED.reason,
      status = 'active',
      updated_at = NOW()
  `;

  await backfillStructuredMemory();
}

export function ensureTherapeuticMemoryStorage(): Promise<void> {
  if (!storagePromise) {
    storagePromise = initializeStorage().catch((error) => {
      storagePromise = null;
      throw error;
    });
  }
  return storagePromise;
}

async function upsertMemory(input: {
  memoryKey: string;
  memoryType: string;
  title: string;
  content: string;
  domains?: string[];
  importance?: number;
  confidence?: number;
  status?: string;
  occurredAt?: Date | string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceLabel?: string | null;
}): Promise<{ id: string; memory_key: string }> {
  const rows = await client`
    INSERT INTO therapeutic_memories (
      memory_key, memory_type, title, content, domains, importance, confidence,
      status, occurred_at, source_type, source_id, source_label, updated_at
    ) VALUES (
      ${input.memoryKey},
      ${input.memoryType},
      ${input.title},
      ${input.content},
      ${JSON.stringify(input.domains || [])}::jsonb,
      ${clamp01(input.importance, 0.5)},
      ${clamp01(input.confidence, 0.7)},
      ${input.status || 'active'},
      ${input.occurredAt ? new Date(input.occurredAt) : null},
      ${input.sourceType || null},
      ${input.sourceId || null},
      ${input.sourceLabel || null},
      NOW()
    )
    ON CONFLICT (memory_key) DO UPDATE SET
      memory_type = EXCLUDED.memory_type,
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      domains = EXCLUDED.domains,
      importance = GREATEST(therapeutic_memories.importance, EXCLUDED.importance),
      confidence = EXCLUDED.confidence,
      status = EXCLUDED.status,
      occurred_at = COALESCE(EXCLUDED.occurred_at, therapeutic_memories.occurred_at),
      source_type = COALESCE(EXCLUDED.source_type, therapeutic_memories.source_type),
      source_id = COALESCE(EXCLUDED.source_id, therapeutic_memories.source_id),
      source_label = COALESCE(EXCLUDED.source_label, therapeutic_memories.source_label),
      embedding = CASE
        WHEN therapeutic_memories.title IS DISTINCT FROM EXCLUDED.title
          OR therapeutic_memories.content IS DISTINCT FROM EXCLUDED.content
          OR therapeutic_memories.domains IS DISTINCT FROM EXCLUDED.domains
        THEN NULL ELSE therapeutic_memories.embedding END,
      embedding_model = CASE
        WHEN therapeutic_memories.title IS DISTINCT FROM EXCLUDED.title
          OR therapeutic_memories.content IS DISTINCT FROM EXCLUDED.content
          OR therapeutic_memories.domains IS DISTINCT FROM EXCLUDED.domains
        THEN NULL ELSE therapeutic_memories.embedding_model END,
      updated_at = NOW()
    RETURNING id::text, memory_key
  `;
  return rows[0] as { id: string; memory_key: string };
}

async function addMemorySource(
  memoryId: string,
  sourceType: string,
  sourceId: string | null,
  sourceExcerpt: string | null,
  sourceDate?: Date | string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const existing = await client`
    SELECT id
    FROM memory_sources
    WHERE memory_id = ${memoryId}::uuid
      AND source_type = ${sourceType}
      AND COALESCE(source_id, '') = COALESCE(${sourceId}, '')
      AND COALESCE(source_excerpt, '') = COALESCE(${sourceExcerpt}, '')
    LIMIT 1
  `;
  if (existing.length) return;

  await client`
    INSERT INTO memory_sources (memory_id, source_type, source_id, source_date, source_excerpt, metadata)
    VALUES (
      ${memoryId}::uuid,
      ${sourceType},
      ${sourceId},
      ${sourceDate ? new Date(sourceDate) : null},
      ${sourceExcerpt},
      ${JSON.stringify(metadata)}::jsonb
    )
  `;
}

async function backfillStructuredMemory(): Promise<void> {
  const summaries = await client`
    SELECT
      s.id::text AS summary_id,
      s.session_id::text AS session_id,
      s.main_issue,
      s.key_observations,
      s.key_insight,
      s.homework,
      s.follow_up_topics,
      COALESCE(ts.started_at, s.created_at) AS occurred_at
    FROM session_summaries s
    LEFT JOIN therapy_sessions ts ON ts.id = s.session_id
    ORDER BY s.created_at ASC
  `;

  for (const row of summaries) {
    const observations = asStringArray(row.key_observations);
    const followUps = asStringArray(row.follow_up_topics);
    const content = [
      row.key_insight ? `Zentrale Erkenntnis: ${row.key_insight}` : null,
      observations.length ? `Beobachtungen:\n- ${observations.join('\n- ')}` : null,
      row.homework ? `Nächster Schritt: ${row.homework}` : null,
      followUps.length ? `Offene Punkte:\n- ${followUps.join('\n- ')}` : null,
    ].filter(Boolean).join('\n\n');

    const memory = await upsertMemory({
      memoryKey: `session-summary:${row.summary_id}`,
      memoryType: 'episodic',
      title: row.main_issue,
      content: content || row.main_issue,
      domains: inferDomains(`${row.main_issue} ${content}`),
      importance: 0.72,
      confidence: 0.88,
      occurredAt: row.occurred_at,
      sourceType: 'session_summary',
      sourceId: row.summary_id,
      sourceLabel: `Therapiesitzung ${row.session_id}`,
    });
    await addMemorySource(memory.id, 'session_summary', row.summary_id, row.key_insight || row.main_issue, row.occurred_at);
  }

  const formulations = await client`
    SELECT id, version, summary, created_at
    FROM case_formulations
    ORDER BY created_at DESC
  `;
  for (let index = 0; index < formulations.length; index += 1) {
    const row = formulations[index];
    await upsertMemory({
      memoryKey: `formulation:${row.id}`,
      memoryType: 'formulation',
      title: `Fallformulierung ${row.version}`,
      content: row.summary,
      domains: ['fallformulierung'],
      importance: index === 0 ? 0.98 : 0.75,
      confidence: 0.78,
      status: index === 0 ? 'active' : 'superseded',
      occurredAt: row.created_at,
      sourceType: 'case_formulation',
      sourceId: row.id,
      sourceLabel: row.version,
    });
  }

  const hypotheses = await client`
    SELECT id, title, description, confidence, status, updated_at
    FROM hypotheses
    ORDER BY updated_at DESC
  `;
  for (const row of hypotheses) {
    await upsertMemory({
      memoryKey: `hypothesis:${row.id}`,
      memoryType: 'hypothesis',
      title: row.title,
      content: row.description,
      domains: inferDomains(`${row.title} ${row.description}`),
      importance: row.status === 'active' ? 0.83 : 0.55,
      confidence: clamp01(row.confidence, 0.5),
      status: row.status === 'active' ? 'active' : 'superseded',
      occurredAt: row.updated_at,
      sourceType: 'hypothesis',
      sourceId: row.id,
      sourceLabel: 'Arbeitshypothese',
    });
  }
}

async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (!openai || texts.length === 0) return [];
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
    encoding_format: 'float',
  });
  return response.data.map((item) => item.embedding);
}

async function embedRows(rows: any[]): Promise<void> {
  if (!openai || rows.length === 0) return;
  try {
    const vectors = await createEmbeddings(
      rows.map((row) => memoryText(row.title, row.content, asStringArray(row.domains))),
    );
    for (let index = 0; index < rows.length; index += 1) {
      const vector = vectors[index];
      if (!vector) continue;
      await client`
        UPDATE therapeutic_memories
        SET embedding = ${JSON.stringify(vector)}::jsonb,
            embedding_model = ${`${EMBEDDING_MODEL}:${EMBEDDING_DIMENSIONS}`},
            updated_at = NOW()
        WHERE id = ${rows[index].id}::uuid
      `;
    }
  } catch (error: any) {
    console.warn('Therapeutic memory embedding deferred:', error?.message || error);
  }
}

async function embedMissingMemories(limit = 120): Promise<void> {
  if (!openai) return;
  const rows = await client`
    SELECT id::text, title, content, domains
    FROM therapeutic_memories
    WHERE status = 'active' AND embedding IS NULL
    ORDER BY importance DESC, COALESCE(occurred_at, created_at) DESC
    LIMIT ${Math.max(1, Math.min(limit, 250))}
  `;
  await embedRows(rows);
}

async function embedMemoryKeys(memoryKeys: string[]): Promise<void> {
  if (!openai || memoryKeys.length === 0) return;
  const uniqueKeys = Array.from(new Set(memoryKeys));
  const rows: any[] = [];
  for (const key of uniqueKeys) {
    const found = await client`
      SELECT id::text, title, content, domains
      FROM therapeutic_memories
      WHERE memory_key = ${key} AND status = 'active'
      LIMIT 1
    `;
    if (found[0]) rows.push(found[0]);
  }
  await embedRows(rows);
}

export async function ingestSessionSummaryMemory(input: SessionMemoryInput): Promise<void> {
  await ensureTherapeuticMemoryStorage();

  const observations = asStringArray(input.keyObservations);
  const followUps = asStringArray(input.followUpTopics);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const episodicContent = [
    input.keyInsight ? `Zentrale Erkenntnis: ${input.keyInsight}` : null,
    observations.length ? `Beobachtungen:\n- ${observations.join('\n- ')}` : null,
    input.interventionUsed ? `Methode: ${input.interventionUsed}` : null,
    input.homework ? `Nächster Schritt: ${input.homework}` : null,
    followUps.length ? `Offene Punkte:\n- ${followUps.join('\n- ')}` : null,
  ].filter(Boolean).join('\n\n');

  const createdKeys: string[] = [];
  const episodic = await upsertMemory({
    memoryKey: `session-summary:${input.summaryId}`,
    memoryType: 'episodic',
    title: input.mainIssue,
    content: episodicContent || input.mainIssue,
    domains: inferDomains(`${input.mainIssue} ${episodicContent}`),
    importance: 0.74,
    confidence: 0.9,
    occurredAt,
    sourceType: 'session_summary',
    sourceId: input.summaryId,
    sourceLabel: `Therapiesitzung ${input.sessionId}`,
  });
  createdKeys.push(episodic.memory_key);
  await addMemorySource(episodic.id, 'session_summary', input.summaryId, input.keyInsight || input.mainIssue, occurredAt);

  for (const candidate of (input.memoryCandidates || []).slice(0, 8)) {
    if (!candidate?.title?.trim() || !candidate?.content?.trim()) continue;
    const memoryType = candidate.type === 'hypothesis'
      ? 'hypothesis'
      : candidate.type === 'milestone'
        ? 'milestone'
        : 'semantic';
    const candidateKey = `${memoryType}:${hash(`${candidate.title.trim()}|${candidate.content.trim().toLowerCase()}`)}`;
    const memory = await upsertMemory({
      memoryKey: candidateKey,
      memoryType,
      title: candidate.title.trim(),
      content: candidate.content.trim(),
      domains: Array.from(new Set([...(candidate.domains || []), ...inferDomains(`${candidate.title} ${candidate.content}`)])),
      importance: clamp01(candidate.importance, memoryType === 'hypothesis' ? 0.62 : 0.76),
      confidence: clamp01(candidate.confidence, memoryType === 'hypothesis' ? 0.6 : 0.85),
      occurredAt,
      sourceType: 'session_summary',
      sourceId: input.summaryId,
      sourceLabel: input.mainIssue,
    });
    createdKeys.push(memory.memory_key);
    await addMemorySource(
      memory.id,
      'session_summary',
      input.summaryId,
      candidate.evidence || candidate.content,
      occurredAt,
      { sessionId: input.sessionId, memoryCandidateType: candidate.type || 'semantic' },
    );
  }

  for (const correction of (input.corrections || []).slice(0, 5)) {
    if (!correction?.incorrectClaim?.trim() || !correction?.correctedClaim?.trim()) continue;
    const correctionKey = `corr:${hash(`${correction.incorrectClaim}|${correction.correctedClaim}`)}`;
    await client`
      INSERT INTO memory_corrections (
        correction_key, incorrect_claim, corrected_claim, reason, source_type, source_id, status
      ) VALUES (
        ${correctionKey},
        ${correction.incorrectClaim.trim()},
        ${correction.correctedClaim.trim()},
        ${correction.reason?.trim() || 'Explizite Korrektur innerhalb einer Therapiesitzung.'},
        'session_summary',
        ${input.summaryId},
        'active'
      )
      ON CONFLICT (correction_key) DO UPDATE SET
        corrected_claim = EXCLUDED.corrected_claim,
        reason = EXCLUDED.reason,
        source_type = EXCLUDED.source_type,
        source_id = EXCLUDED.source_id,
        status = 'active',
        updated_at = NOW()
    `;
  }

  await embedMemoryKeys(createdKeys);
}

function mapRetrievedMemory(row: any): RetrievedMemory {
  return {
    memoryKey: row.memory_key,
    memoryType: row.memory_type,
    title: row.title,
    content: row.content,
    domains: asStringArray(row.domains),
    importance: Number(row.importance),
    confidence: Number(row.confidence),
    occurredAt: row.occurred_at,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceLabel: row.source_label,
  };
}

function mapConsolidation(row: any): MemoryConsolidation {
  return {
    periodKey: row.period_key,
    periodType: row.period_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    title: row.title,
    summary: row.summary,
    keyChanges: asStringArray(row.key_changes),
    stablePatterns: asStringArray(row.stable_patterns),
    openQuestions: asStringArray(row.open_questions),
    importantMemoryKeys: asStringArray(row.important_memory_keys),
    sourceCount: Number(row.source_count || 0),
    updatedAt: row.updated_at,
  };
}

export async function retrieveTherapeuticMemory(query: string, limit = 8): Promise<{
  core: RetrievedMemory[];
  relevant: RetrievedMemory[];
  corrections: MemoryCorrection[];
  consolidations: MemoryConsolidation[];
  mode: 'hybrid' | 'lexical';
}> {
  await ensureTherapeuticMemoryStorage();
  await embedMissingMemories(120);

  const correctionRows = await client`
    SELECT correction_key, incorrect_claim, corrected_claim, reason, source_type, source_id
    FROM memory_corrections
    WHERE status = 'active'
    ORDER BY updated_at DESC
    LIMIT 30
  `;
  const corrections: MemoryCorrection[] = correctionRows.map((row) => ({
    correctionKey: row.correction_key,
    incorrectClaim: row.incorrect_claim,
    correctedClaim: row.corrected_claim,
    reason: row.reason,
    sourceType: row.source_type,
    sourceId: row.source_id,
  }));

  const coreRows = await client`
    SELECT memory_key, memory_type, title, content, domains, importance, confidence,
           occurred_at, source_type, source_id, source_label
    FROM therapeutic_memories
    WHERE status = 'active'
      AND memory_type IN ('semantic', 'milestone')
      AND importance >= 0.80
    ORDER BY importance DESC, COALESCE(occurred_at, created_at) DESC
    LIMIT 10
  `;
  const core = coreRows.map(mapRetrievedMemory);

  const candidates = await client`
    SELECT memory_key, memory_type, title, content, domains, importance, confidence,
           occurred_at, source_type, source_id, source_label, embedding
    FROM therapeutic_memories
    WHERE status = 'active'
    ORDER BY importance DESC, COALESCE(occurred_at, created_at) DESC
    LIMIT 1500
  `;

  let queryEmbedding: number[] | null = null;
  if (openai && query.trim()) {
    try {
      queryEmbedding = (await createEmbeddings([query.slice(0, 10_000)]))[0] || null;
    } catch (error: any) {
      console.warn('Semantic memory retrieval unavailable; lexical fallback used:', error?.message || error);
    }
  }

  const mode: 'hybrid' | 'lexical' = queryEmbedding ? 'hybrid' : 'lexical';
  const scored = candidates.map((row) => {
    const domains = asStringArray(row.domains);
    const text = memoryText(row.title, row.content, domains);
    const lexical = lexicalSimilarity(query, text);
    const importance = clamp01(row.importance, 0.5);
    const recency = recencyScore(row.occurred_at);
    const storedVector = Array.isArray(row.embedding) ? row.embedding.map(Number) : null;
    const semantic = queryEmbedding && storedVector
      ? Math.max(0, cosineSimilarity(queryEmbedding, storedVector))
      : 0;
    const score = queryEmbedding
      ? semantic * 0.7 + lexical * 0.15 + importance * 0.1 + recency * 0.05
      : lexical * 0.62 + importance * 0.23 + recency * 0.15;
    return { ...mapRetrievedMemory(row), score };
  });

  const coreKeys = new Set(core.map((item) => item.memoryKey));
  const relevant = scored
    .filter((item) => !coreKeys.has(item.memoryKey))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, Math.max(1, Math.min(limit, 15)));

  const consolidationRows = await client`
    SELECT period_key, period_type, period_start, period_end, title, summary,
           key_changes, stable_patterns, open_questions, important_memory_keys,
           source_count, updated_at
    FROM memory_consolidations
    ORDER BY period_end DESC, updated_at DESC
    LIMIT 4
  `;
  const consolidations = consolidationRows.map(mapConsolidation);

  await client`
    INSERT INTO memory_retrieval_events (query, mode, selected_memory_keys, selected_correction_keys)
    VALUES (
      ${query || '[kein spezifisches Suchthema]'},
      ${mode},
      ${JSON.stringify([...core.map((item) => item.memoryKey), ...relevant.map((item) => item.memoryKey)])}::jsonb,
      ${JSON.stringify(corrections.map((item) => item.correctionKey))}::jsonb
    )
  `.catch(() => []);

  return { core, relevant, corrections, consolidations, mode };
}

export function formatTherapeuticMemoryContext(
  memory: Awaited<ReturnType<typeof retrieveTherapeuticMemory>>,
): string {
  const formatMemory = (item: RetrievedMemory) => {
    const source = item.sourceLabel
      || (item.sourceType && item.sourceId ? `${item.sourceType}:${item.sourceId}` : item.sourceType)
      || 'strukturierte Erinnerung';
    return `• [${item.memoryType}] ${item.title}: ${item.content}\n  Quelle: ${source}; Konfidenz ${Math.round(item.confidence * 100)}%; Wichtigkeit ${Math.round(item.importance * 100)}%`;
  };

  const correctionText = memory.corrections.length
    ? memory.corrections
      .map((item) => `• NICHT VERWENDEN: „${item.incorrectClaim}“ → KORREKTUR: ${item.correctedClaim}${item.reason ? ` (${item.reason})` : ''}`)
      .join('\n')
    : 'Keine aktiven Korrekturen.';
  const coreText = memory.core.length
    ? memory.core.map(formatMemory).join('\n')
    : 'Noch keine stabilen semantischen Langzeiterinnerungen.';
  const relevantText = memory.relevant.length
    ? memory.relevant.map(formatMemory).join('\n')
    : 'Keine älteren Erinnerungen mit ausreichender thematischer Relevanz gefunden.';
  const consolidationText = memory.consolidations.length
    ? memory.consolidations
      .map((item) => `• ${item.title} (${item.periodStart}–${item.periodEnd}): ${item.summary}\n  Veränderungen: ${item.keyChanges.join(' | ') || 'keine'}\n  Offene Fragen: ${item.openQuestions.join(' | ') || 'keine'}`)
      .join('\n')
    : 'Noch keine Wochen-/Monatskonsolidierungen vorhanden.';

  return `
LANGZEITGEDÄCHTNIS — RETRIEVAL-MODUS: ${memory.mode}

AUTORITATIVE KORREKTUREN (haben Vorrang vor allen älteren Einträgen):
${correctionText}

STABILE / HOCHRELEVANTE ERINNERUNGEN:
${coreText}

THEMATISCH RELEVANTE ÄLTERE ERINNERUNGEN:
${relevantText}

VERLAUFSKONSOLIDIERUNGEN:
${consolidationText}

MEMORY-REGELN:
- Korrekturen schlagen ältere widersprechende Erinnerungen immer.
- Eine Erinnerung ist eine verdichtete Darstellung mit Quelle, nicht automatisch eine objektive Tatsache.
- Hypothesen bleiben Hypothesen, auch wenn sie häufig wiederholt wurden.
- Wenn ein aktueller Selbstbericht einer alten Erinnerung widerspricht, den Widerspruch explizit klären statt die alte Erinnerung stillschweigend zu bevorzugen.
- Bei relevanten Aussagen möglichst angeben, ob sie aus aktuellem Selbstbericht, Langzeitgedächtnis, Fallformulierung oder Arbeitshypothese stammen.
`.trim();
}

function dateStringInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateString: string, amount: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

function weeklyPeriod(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  const start = addDays(dateString, 1 - weekday);
  const end = addDays(start, 6);
  const thursday = new Date(Date.UTC(year, month - 1, day + (4 - weekday)));
  const isoYear = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return {
    start,
    end,
    key: `weekly:${isoYear}-W${String(week).padStart(2, '0')}`,
    label: `KW ${week} / ${isoYear}`,
  };
}

function monthlyPeriod(dateString: string) {
  const [year, month] = dateString.split('-').map(Number);
  const monthText = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`,
    key: `monthly:${year}-${monthText}`,
    label: `${monthText}/${year}`,
  };
}

async function buildPeriodConsolidation(
  periodType: 'weekly' | 'monthly',
  period: { start: string; end: string; key: string; label: string },
): Promise<void> {
  const summaries = await client`
    SELECT main_issue, key_observations, key_insight, homework, follow_up_topics, created_at
    FROM session_summaries
    WHERE created_at::date BETWEEN ${period.start}::date AND ${period.end}::date
    ORDER BY created_at ASC
  `;
  const checkins = await client`
    SELECT date, mood, fulfillment, loneliness, inner_calm, joy, rumination,
           future_anxiety, novelty_drive, energy, life_satisfaction, note
    FROM daily_checkins
    WHERE date BETWEEN ${period.start} AND ${period.end}
    ORDER BY date ASC
  `;
  const memories = await client`
    SELECT memory_key, title, content, importance
    FROM therapeutic_memories
    WHERE status = 'active'
      AND COALESCE(occurred_at, created_at)::date BETWEEN ${period.start}::date AND ${period.end}::date
    ORDER BY importance DESC
    LIMIT 30
  `;

  const sourceCount = summaries.length + checkins.length + memories.length;
  if (sourceCount === 0) return;

  let result = {
    summary: `${summaries.length} Therapiesitzung(en), ${checkins.length} Check-in(s) und ${memories.length} relevante Langzeiterinnerung(en) wurden für diesen Zeitraum zusammengeführt.`,
    keyChanges: summaries.map((row) => row.key_insight).filter(Boolean).slice(-5) as string[],
    stablePatterns: memories.slice(0, 5).map((row) => `${row.title}: ${row.content}`),
    openQuestions: summaries.flatMap((row) => asStringArray(row.follow_up_topics)).slice(-6),
  };

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: SYNTHESIS_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'Du konsolidierst den longitudinalen Verlauf einer KVT/ACT-Selbsthilfe-App. Erstelle nur aus den gelieferten Daten eine knappe Verlaufssynthese. Trenne Veränderungen von stabilen Mustern und offenen Fragen. Hypothesen nie als Tatsachen formulieren. Antworte als JSON: {"summary":"...","keyChanges":["..."],"stablePatterns":["..."],"openQuestions":["..."]}.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              sessions: summaries.map((row) => ({
                topic: row.main_issue,
                observations: asStringArray(row.key_observations),
                insight: row.key_insight,
                homework: row.homework,
                followUp: asStringArray(row.follow_up_topics),
              })),
              checkins,
              importantMemories: memories.map((row) => ({
                key: row.memory_key,
                title: row.title,
                content: row.content,
              })),
            }),
          },
        ],
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.summary) {
        result = {
          summary: String(parsed.summary),
          keyChanges: asStringArray(parsed.keyChanges).slice(0, 8),
          stablePatterns: asStringArray(parsed.stablePatterns).slice(0, 8),
          openQuestions: asStringArray(parsed.openQuestions).slice(0, 8),
        };
      }
    } catch (error: any) {
      console.warn(`${periodType} memory consolidation used deterministic fallback:`, error?.message || error);
    }
  }

  const title = periodType === 'weekly'
    ? `Wochenkonsolidierung ${period.label}`
    : `Monatskonsolidierung ${period.label}`;
  await client`
    INSERT INTO memory_consolidations (
      period_key, period_type, period_start, period_end, title, summary,
      key_changes, stable_patterns, open_questions, important_memory_keys,
      source_count, updated_at
    ) VALUES (
      ${period.key},
      ${periodType},
      ${period.start},
      ${period.end},
      ${title},
      ${result.summary},
      ${JSON.stringify(result.keyChanges)}::jsonb,
      ${JSON.stringify(result.stablePatterns)}::jsonb,
      ${JSON.stringify(result.openQuestions)}::jsonb,
      ${JSON.stringify(memories.slice(0, 12).map((row) => row.memory_key))}::jsonb,
      ${sourceCount},
      NOW()
    )
    ON CONFLICT (period_key) DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      key_changes = EXCLUDED.key_changes,
      stable_patterns = EXCLUDED.stable_patterns,
      open_questions = EXCLUDED.open_questions,
      important_memory_keys = EXCLUDED.important_memory_keys,
      source_count = EXCLUDED.source_count,
      updated_at = NOW()
  `;
}

export async function refreshAutomaticMemoryConsolidations(referenceDate = new Date()): Promise<void> {
  await ensureTherapeuticMemoryStorage();
  const profile = await client`SELECT timezone FROM patient_profile ORDER BY created_at ASC LIMIT 1`;
  const timeZone = profile[0]?.timezone || 'Europe/Berlin';
  const dateString = dateStringInTimezone(referenceDate, timeZone);
  await buildPeriodConsolidation('weekly', weeklyPeriod(dateString));
  await buildPeriodConsolidation('monthly', monthlyPeriod(dateString));
}

export async function getMemoryDashboardData() {
  await ensureTherapeuticMemoryStorage();
  const counts = await client`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE status = 'active' AND memory_type = 'episodic')::int AS episodic,
      COUNT(*) FILTER (WHERE status = 'active' AND memory_type = 'semantic')::int AS semantic,
      COUNT(*) FILTER (WHERE status = 'active' AND memory_type = 'hypothesis')::int AS hypotheses
    FROM therapeutic_memories
  `;
  const recentMemories = await client`
    SELECT memory_key, memory_type, title, content, domains, importance, confidence,
           occurred_at, source_type, source_id, source_label
    FROM therapeutic_memories
    WHERE status = 'active'
    ORDER BY COALESCE(occurred_at, created_at) DESC, importance DESC
    LIMIT 20
  `;
  const correctionRows = await client`
    SELECT correction_key, incorrect_claim, corrected_claim, reason, source_type, source_id
    FROM memory_corrections
    WHERE status = 'active'
    ORDER BY updated_at DESC
    LIMIT 20
  `;
  const consolidationRows = await client`
    SELECT period_key, period_type, period_start, period_end, title, summary,
           key_changes, stable_patterns, open_questions, important_memory_keys,
           source_count, updated_at
    FROM memory_consolidations
    ORDER BY period_end DESC, updated_at DESC
    LIMIT 12
  `;

  return {
    counts: counts[0] || { active: 0, episodic: 0, semantic: 0, hypotheses: 0 },
    recentMemories: recentMemories.map(mapRetrievedMemory),
    corrections: correctionRows.map((row) => ({
      correctionKey: row.correction_key,
      incorrectClaim: row.incorrect_claim,
      correctedClaim: row.corrected_claim,
      reason: row.reason,
      sourceType: row.source_type,
      sourceId: row.source_id,
    })) as MemoryCorrection[],
    consolidations: consolidationRows.map(mapConsolidation),
    embeddingMode: openai ? `${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}D)` : 'lexikalischer Fallback',
  };
}
