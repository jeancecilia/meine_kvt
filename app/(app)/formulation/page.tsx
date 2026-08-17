import { db } from '@/lib/db';
import { hypotheses, therapyGoals, caseFormulations, sessionSummaries } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { FileText, Target, ShieldCheck, Compass, History, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { ensureFocusedSessionMemory20260817 } from '@/lib/therapy/focused-session-memory';

export const revalidate = 0;

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export default async function FormulationPage() {
  // Keep the structured learnings from the focused 17 Aug session available even
  // if the user opens the formulation page before starting another therapy chat.
  await ensureFocusedSessionMemory20260817().catch((error) => {
    console.warn('Focused-session memory could not be initialized:', error?.message || error);
  });

  const hypothesisList = await db.select().from(hypotheses).orderBy(desc(hypotheses.confidence)).catch(() => []);
  const goalsList = await db.select().from(therapyGoals).orderBy(therapyGoals.orderIndex).catch(() => []);
  const formulations = await db.select().from(caseFormulations).orderBy(desc(caseFormulations.createdAt)).limit(1).catch(() => []);
  const recentSummaries = await db.select().from(sessionSummaries).orderBy(desc(sessionSummaries.createdAt)).limit(3).catch(() => []);
  const currentFormulation = formulations[0] || null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" />
          Klinisches Verwendungsmodell
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Fallformulierung & Hypothesen ({currentFormulation?.version || 'v0.1'})</h1>
        <p className="text-xs text-slate-400 mt-1">
          Dynamisches Modell zur Unterscheidung von Fakten, Selbstbericht, Erwartungen und Arbeitshypothesen.
        </p>
      </div>

      {currentFormulation && (
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Aktuelle Fallkonzeption ({currentFormulation.version})
            </span>
            <span className="text-[10px] text-slate-500">Versioniert · nicht als Diagnose zu lesen</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
            {currentFormulation.summary}
          </p>
        </div>
      )}

      {recentSummaries.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <History className="w-4 h-4" />
            Letzte Sitzungs-Learnings
          </div>
          <p className="text-xs text-slate-500">
            Strukturierte therapeutische Erinnerung. Hier stehen die Learnings, die zukünftige Sitzungen wieder aufgreifen sollen.
          </p>

          <div className="space-y-4">
            {recentSummaries.map((summary) => {
              const observations = asStringArray(summary.keyObservations);
              const followUps = asStringArray(summary.followUpTopics);

              return (
                <div key={summary.id} className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-start gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-100">{summary.mainIssue}</h3>
                      {summary.interventionUsed && (
                        <p className="text-[11px] text-slate-500 mt-1">{summary.interventionUsed}</p>
                      )}
                    </div>
                  </div>

                  {summary.keyInsight && (
                    <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-indigo-300 mb-1">Zentrale Erkenntnis</div>
                      <p className="text-slate-300 leading-relaxed">{summary.keyInsight}</p>
                    </div>
                  )}

                  {observations.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Gesicherte Selbstberichte / Beobachtungen</div>
                      <ul className="space-y-1.5 text-slate-400">
                        {observations.map((item, idx) => (
                          <li key={idx} className="flex gap-2 leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.homework && (
                    <div className="pt-2 border-t border-slate-800/70">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-purple-400 mb-1">Aktueller nächster Schritt</div>
                      <p className="text-slate-300 leading-relaxed">{summary.homework}</p>
                    </div>
                  )}

                  {followUps.length > 0 && (
                    <details className="pt-1">
                      <summary className="cursor-pointer text-[11px] font-medium text-slate-400 hover:text-slate-200">Offene Folgefragen ({followUps.length})</summary>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-500">
                        {followUps.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Target className="w-4 h-4" />
          Therapieziele (Datenbank-gestützt)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {goalsList.map((g, idx) => (
            <div key={g.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 space-y-2">
              <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span>{g.title}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{g.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Aktive Arbeitshypothesen</h2>

        {hypothesisList.map((hyp) => {
          const confVal = Math.round(Number(hyp.confidence) * 100);
          return (
            <div key={hyp.id} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-sm text-slate-100">{hyp.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full">
                    Vertrauen: {confVal}%
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full capitalize">
                    {hyp.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                {hyp.description}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Arbeitshypothese zur Steuerung der Verhaltensexperimente (keine medizinische Diagnose).</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
