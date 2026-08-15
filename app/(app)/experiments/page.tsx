import { db } from '@/lib/db';
import { experiments } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { FlaskConical, Plus, Clock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const revalidate = 0;

export default async function ExperimentsPage() {
  const experimentList = await db.select().from(experiments).orderBy(desc(experiments.createdAt));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            Verhaltensexperimente
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Aktive & Geplante Experimente</h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirische Überprüfung von Überzeugungen und Impulskreisläufen im Alltag.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-lg shadow-purple-900/20">
          <Plus className="w-4 h-4" />
          <span>Neues Experiment</span>
        </button>
      </div>

      <div className="space-y-4">
        {experimentList.map((exp) => (
          <div key={exp.id} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-lg flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                <span>{exp.title}</span>
              </span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                {exp.status === 'active' ? 'Aktiv (7 Tage Test)' : exp.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 space-y-1.5">
                <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Arbeitshypothese</div>
                <div className="text-slate-200 leading-relaxed">{exp.hypothesis}</div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 space-y-1.5">
                <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Erwartete Vorhersage</div>
                <div className="text-slate-200 leading-relaxed">{exp.prediction}</div>
              </div>
            </div>

            <div className="bg-purple-500/5 border border-purple-500/15 p-4 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Konkreter Handlungsauftrag für die nächsten 7 Tage:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{exp.instructions}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Laufzeit: {exp.startDate} bis {exp.endDate}</span>
              </div>

              <button className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium">
                <span>Beobachtung protokollieren</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
