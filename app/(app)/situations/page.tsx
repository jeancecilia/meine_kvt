import { db } from '@/lib/db';
import { situations } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { AlertCircle, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

export const revalidate = 0;

export default async function SituationsPage() {
  const situationList = await db.select().from(situations).orderBy(desc(situations.createdAt));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4" />
            Funktionale KVT-Analyse
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Situations- & Kognitionsanalyse</h1>
          <p className="text-xs text-slate-400 mt-1">
            Strukturierte Erfassung konkreter Auslöser nach dem 5-Punkte-KVT-Schema.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-lg shadow-amber-900/20">
          <Plus className="w-4 h-4" />
          <span>Neue Situation erlangen</span>
        </button>
      </div>

      <div className="space-y-4">
        {situationList.map((sit) => (
          <div key={sit.id} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-lg">
                {sit.category || 'Situation 001'}
              </span>
              <span className="text-[11px] text-slate-500">
                {new Date(sit.occurredAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-100">{sit.description}</h2>
              {sit.aiSummary && (
                <div className="flex items-start gap-2 bg-teal-500/5 border border-teal-500/15 p-3 rounded-xl text-xs text-teal-300">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{sit.aiSummary}</span>
                </div>
              )}
            </div>

            {/* 5-Step CBT Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">1. Objektive Situation</div>
                <div className="text-slate-200">{sit.objectiveSituation || sit.description}</div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">2. Erwartung vs. Gefühl</div>
                <div className="text-slate-200">Einsamkeit (7/10), Melancholie (5/10). Erwartung: Euphorie wegen Masterabschluss.</div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">3. Automatische Gedanken</div>
                <div className="text-amber-200 italic font-mono text-[11px] bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  &ldquo;{sit.automaticThoughts}&rdquo;
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">4. Verhalten & Reaktion</div>
                <div className="text-slate-200">{sit.shortTermConsequence}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Klinische Analyse in Fallformulierung integriert</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
