import { db } from '@/lib/db';
import { hypotheses, therapyGoals, caseFormulations } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { FileText, Sparkles, Target, CheckCircle2, ShieldCheck, Compass } from 'lucide-react';

export const revalidate = 0;

export default async function FormulationPage() {
  const hypothesisList = await db.select().from(hypotheses).orderBy(desc(hypotheses.confidence)).catch(() => []);
  const goalsList = await db.select().from(therapyGoals).orderBy(therapyGoals.orderIndex).catch(() => []);
  const formulations = await db.select().from(caseFormulations).orderBy(desc(caseFormulations.createdAt)).limit(1).catch(() => []);
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
          Dynamisches Modell zur Unterscheidung von Fakten, Erwartungen und klinischen Hypothesen.
        </p>
      </div>

      {/* Case Formulation v0.1 Summary */}
      {currentFormulation && (
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Fallkonzeption ({currentFormulation.version})
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
            {currentFormulation.summary}
          </p>
        </div>
      )}

      {/* Therapy Goals v0.1 */}
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

      {/* Clinical Hypotheses List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Aktive Arbeitshypothesen</h2>

        {hypothesisList.map((hyp) => {
          const confVal = Math.round(Number(hyp.confidence) * 100);
          return (
            <div key={hyp.id} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-100">{hyp.title}</h3>
                <div className="flex items-center gap-2">
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
                <span>Arbeitshypothese zur Steuerung der Verhaltensexperimente (Keine medizinische Diagnose).</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
