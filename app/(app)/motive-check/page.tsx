'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

interface MotiveCheck {
  id: string;
  occurredAt: string;
  triggerSituation: string | null;
  mood: number;
  libido: number;
  connectionNeed: number;
  loneliness: number;
  noveltyDrive: number;
  validationNeed: number;
  datingRelationshipNeed: number;
  boredomDistraction: number;
  topMotive: string;
  classificationLabel: string;
  experimentRecommended: boolean;
  status: string;
  experimentObservationId: string | null;
  note: string | null;
}

interface ClassificationResult {
  topMotive: string;
  topScore: number;
  connectionRelevant: boolean;
  experimentRecommended: boolean;
  label: string;
  explanation: string;
}

const motiveConfigs = [
  { key: 'libido', label: 'Libido / Sex', description: 'Ich möchte gerade vor allem sexuelle Befriedigung oder körperliche Nähe.' },
  { key: 'connectionNeed', label: 'Verbundenheit', description: 'Ich möchte jemanden zum Reden, Nähe, Gesellschaft oder echtes Verbundensein.' },
  { key: 'loneliness', label: 'Einsamkeit', description: 'Wie einsam fühle ich mich gerade tatsächlich?' },
  { key: 'noveltyDrive', label: 'Neuheit / Kick', description: 'Ich möchte etwas Neues, Spannendes oder eine neue Person erleben.' },
  { key: 'validationNeed', label: 'Bestätigung', description: 'Ich möchte mich begehrt, interessant oder bestätigt fühlen.' },
  { key: 'datingRelationshipNeed', label: 'Dating / Beziehung', description: 'Ich möchte wirklich eine interessante Person kennenlernen oder Beziehungspotenzial prüfen.' },
  { key: 'boredomDistraction', label: 'Langeweile / Ablenkung', description: 'Ich öffne die App hauptsächlich, weil ich Beschäftigung oder Ablenkung suche.' },
] as const;

type MotiveKey = typeof motiveConfigs[number]['key'];

type MotiveState = Record<MotiveKey, number> & { mood: number };

const initialRatings: MotiveState = {
  mood: 5,
  libido: 5,
  connectionNeed: 5,
  loneliness: 5,
  noveltyDrive: 5,
  validationNeed: 3,
  datingRelationshipNeed: 4,
  boredomDistraction: 3,
};

function RatingSlider({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-200">{label}</div>
          {description && <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</div>}
        </div>
        <span className="font-mono text-sm font-bold text-teal-400 shrink-0">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="0.5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full h-1.5 rounded-lg bg-slate-800 accent-teal-400 cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-slate-600"><span>0</span><span>10</span></div>
    </div>
  );
}

export default function MotiveCheckPage() {
  const [checks, setChecks] = useState<MotiveCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [triggerSituation, setTriggerSituation] = useState('');
  const [note, setNote] = useState('');
  const [ratings, setRatings] = useState<MotiveState>(initialRatings);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [createdCheck, setCreatedCheck] = useState<MotiveCheck | null>(null);
  const [activePending, setActivePending] = useState<MotiveCheck | null>(null);

  const [moodAfter, setMoodAfter] = useState(5);
  const [lonelinessAfter, setLonelinessAfter] = useState(5);
  const [connectionAfter, setConnectionAfter] = useState(5);
  const [libidoAfter, setLibidoAfter] = useState(5);
  const [noveltyAfter, setNoveltyAfter] = useState(5);
  const [actionTaken, setActionTaken] = useState('15–30 Min. echte soziale Verbindung hergestellt');
  const [afterNote, setAfterNote] = useState('');

  const pendingChecks = useMemo(() => checks.filter((check) => check.status === 'experiment_pending'), [checks]);

  const loadChecks = async () => {
    try {
      const response = await fetch('/api/motive-checks', { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data)) setChecks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecks();
  }, []);

  const setRating = (key: keyof MotiveState, value: number) => {
    setRatings((current) => ({ ...current, [key]: value }));
  };

  const resetNewCheck = () => {
    setCreatedCheck(null);
    setClassification(null);
    setTriggerSituation('');
    setNote('');
    setRatings(initialRatings);
  };

  const submitMotiveCheck = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/motive-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerSituation, note, ...ratings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Speichern fehlgeschlagen');
      setCreatedCheck(data.check);
      setClassification(data.classification);
      await loadChecks();
    } catch (error: any) {
      alert(error?.message || 'Motivcheck konnte nicht gespeichert werden');
    } finally {
      setSubmitting(false);
    }
  };

  const startPendingExperiment = (check: MotiveCheck) => {
    setActivePending(check);
    setMoodAfter(check.mood);
    setLonelinessAfter(check.loneliness);
    setConnectionAfter(check.connectionNeed);
    setLibidoAfter(check.libido);
    setNoveltyAfter(check.noveltyDrive);
    setAfterNote('');
  };

  const completeExperiment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activePending) return;
    setSubmitting(true);
    try {
      const observationResponse = await fetch('/api/experiments/exp-001/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerSituation: activePending.triggerSituation || 'Dating-/Tinder-Impuls',
          moodBefore: activePending.mood,
          moodAfter,
          lonelinessBefore: activePending.loneliness,
          lonelinessAfter,
          connectionNeedBefore: activePending.connectionNeed,
          connectionNeedAfter: connectionAfter,
          // Legacy DB field currently stores the libido component for Experiment 001.
          romanticSexualNeedBefore: activePending.libido,
          romanticSexualNeedAfter: libidoAfter,
          noveltyDriveBefore: activePending.noveltyDrive,
          noveltyDriveAfter: noveltyAfter,
          actionTaken,
          note: `Motivcheck ${activePending.id}; Libido getrennt von Dating/Beziehung erfasst. ${afterNote}`.trim(),
        }),
      });
      const observation = await observationResponse.json();
      if (!observationResponse.ok) throw new Error(observation.error || 'Beobachtung konnte nicht gespeichert werden');

      const updateResponse = await fetch('/api/motive-checks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activePending.id,
          status: 'completed',
          experimentObservationId: observation.id,
        }),
      });
      if (!updateResponse.ok) throw new Error('Motivcheck konnte nicht abgeschlossen werden');

      setActivePending(null);
      await loadChecks();
    } catch (error: any) {
      alert(error?.message || 'Experiment konnte nicht abgeschlossen werden');
    } finally {
      setSubmitting(false);
    }
  };

  const skipExperiment = async (check: MotiveCheck) => {
    await fetch('/api/motive-checks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: check.id, status: 'skipped' }),
    });
    if (activePending?.id === check.id) setActivePending(null);
    await loadChecks();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Search className="w-4 h-4" /> Phase 1 · Motive Decomposition
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Warum will ich die Dating-App gerade öffnen?</h1>
        <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Das Verhalten selbst wird nicht interpretiert. Wir erfassen kurz seine aktuelle Funktion. Reine Libido, echtes Dating-Interesse, Neuheit oder Langeweile sind nicht automatisch Einsamkeitsregulation.
        </p>
      </div>

      {pendingChecks.length > 0 && (
        <div className="rounded-2xl border border-teal-500/25 bg-teal-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
            <HeartHandshake className="w-4 h-4" /> Offene Connection-Experimente
          </div>
          {pendingChecks.map((check) => (
            <div key={check.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="text-xs">
                <div className="font-semibold text-slate-200">{check.triggerSituation || 'Dating-/Tinder-Impuls'}</div>
                <div className="text-slate-500 mt-1">Einsamkeit {check.loneliness}/10 · Verbundenheit {check.connectionNeed}/10 · Libido {check.libido}/10 · Neuheit {check.noveltyDrive}/10</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startPendingExperiment(check)} className="rounded-lg bg-teal-600 hover:bg-teal-500 px-3 py-1.5 text-xs font-medium text-white">Nachher-Werte eintragen</button>
                <button onClick={() => skipExperiment(check)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white">Überspringen</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <form onSubmit={submitMotiveCheck} className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">10-Sekunden-Motivcheck</h2>
              <p className="text-[11px] text-slate-500 mt-1">Nur eine Momentaufnahme. Mehrere Motive dürfen gleichzeitig hoch sein.</p>
            </div>
            <Activity className="w-5 h-5 text-teal-400" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Was ist gerade passiert?</label>
            <input
              value={triggerSituation}
              onChange={(event) => setTriggerSituation(event.target.value)}
              placeholder="z.B. Freitagabend alleine, spontan Lust auf ein Date"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-teal-500/50"
            />
          </div>

          <RatingSlider label="Stimmung" description="Nur Kontext: Wie ist meine Stimmung gerade insgesamt?" value={ratings.mood} onChange={(value) => setRating('mood', value)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {motiveConfigs.map((config) => (
              <RatingSlider
                key={config.key}
                label={config.label}
                description={config.description}
                value={ratings[config.key]}
                onChange={(value) => setRating(config.key, value)}
              />
            ))}
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Optional: kurze Zusatznotiz"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 outline-none focus:border-teal-500/50 resize-none"
          />

          <button disabled={submitting} className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
            {submitting ? 'Wird gespeichert…' : 'Motivcheck speichern'}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300"><Sparkles className="w-4 h-4" /> Entscheidungsregel</div>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p><strong className="text-slate-200">Einsamkeit oder Verbundenheit ≥5:</strong> Connection-Experiment wird angeboten.</p>
              <p><strong className="text-slate-200">Beide &lt;5:</strong> nur protokollieren. Keine therapeutische Intervention nötig.</p>
              <p>Libido, Neuheit, Bestätigung, Dating-Interesse und Langeweile werden separat gespeichert und nicht pathologisiert.</p>
            </div>
          </div>

          {createdCheck && classification && (
            <div className={`rounded-2xl border p-5 space-y-3 ${classification.experimentRecommended ? 'border-teal-500/30 bg-teal-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {classification.label}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{classification.explanation}</p>
              {classification.experimentRecommended ? (
                <button onClick={() => startPendingExperiment(createdCheck)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 py-2 text-xs font-semibold text-white">
                  Nach sozialer Verbindung fortsetzen <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="text-xs text-emerald-300 bg-emerald-500/10 rounded-xl p-3">
                  Nur geloggt. Du musst vor dem Öffnen der Dating-App nichts weiter tun.
                </div>
              )}
              <button onClick={resetNewCheck} className="w-full text-[11px] text-slate-500 hover:text-slate-300">Neuen Check beginnen</button>
            </div>
          )}
        </div>
      </div>

      {activePending && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
          <form onSubmit={completeExperiment} className="w-full max-w-2xl my-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-400">Experiment 001 · Nachher</div>
                <div className="text-sm font-bold text-slate-100 mt-1">Was hat echte soziale Verbindung verändert?</div>
              </div>
              <button type="button" onClick={() => setActivePending(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
              Vorher: Stimmung {activePending.mood} · Einsamkeit {activePending.loneliness} · Verbundenheit {activePending.connectionNeed} · Libido {activePending.libido} · Neuheit {activePending.noveltyDrive}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <RatingSlider label="Stimmung NACHHER" value={moodAfter} onChange={setMoodAfter} />
              <RatingSlider label="Einsamkeit NACHHER" value={lonelinessAfter} onChange={setLonelinessAfter} />
              <RatingSlider label="Verbundenheitsbedarf NACHHER" value={connectionAfter} onChange={setConnectionAfter} />
              <RatingSlider label="Libido / Sex NACHHER" value={libidoAfter} onChange={setLibidoAfter} />
              <RatingSlider label="Neuheitsdrang NACHHER" value={noveltyAfter} onChange={setNoveltyAfter} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Was hast du tatsächlich gemacht?</label>
              <input value={actionTaken} onChange={(event) => setActionTaken(event.target.value)} required className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none" />
            </div>
            <textarea value={afterNote} onChange={(event) => setAfterNote(event.target.value)} rows={2} placeholder="Optional: Was ist dir aufgefallen?" className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 outline-none resize-none" />

            <button disabled={submitting} className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
              {submitting ? 'Wird gespeichert…' : 'Experiment abschließen'}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Letzte Motivchecks</h2>
          <button onClick={loadChecks} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-teal-300"><RefreshCcw className="w-3.5 h-3.5" /> Aktualisieren</button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Lade…</div>
        ) : checks.length === 0 ? (
          <div className="text-xs text-slate-500">Noch keine Motivchecks. Das ist kein tägliches Pflichtformular — nur bei einem realen Dating-/Tinder-Impuls verwenden.</div>
        ) : (
          <div className="space-y-2">
            {checks.slice(0, 12).map((check) => (
              <div key={check.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="font-semibold text-slate-200">{check.classificationLabel}</div>
                  <div className="text-[10px] text-slate-500">{new Date(check.occurredAt).toLocaleString('de-DE')} · {check.status}</div>
                </div>
                <div className="text-slate-500 mt-1">Libido {check.libido} · Connection {check.connectionNeed} · Einsamkeit {check.loneliness} · Neuheit {check.noveltyDrive} · Bestätigung {check.validationNeed} · Dating {check.datingRelationshipNeed} · Langeweile {check.boredomDistraction}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
