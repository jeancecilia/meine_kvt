import { BrainCircuit, Database, History, ShieldCheck, Sparkles, Link2 } from 'lucide-react';
import { getMemoryDashboardData } from '@/lib/therapy/memory';
import { MemorySearch } from '@/components/memory/memory-search';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function dateLabel(value: string | Date | null | undefined): string {
  if (!value) return 'ohne Datum';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default async function MemoryPage() {
  const data = await getMemoryDashboardData();
  const counts = data.counts as any;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <BrainCircuit className="w-4 h-4" />
          Therapeutic Memory
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Langzeitgedächtnis</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Dauerhafte, quellengebundene Erinnerung über Sitzungen hinweg. Die Therapie-KI kombiniert aktuellen Verlauf mit relevanten älteren Episoden, stabilen Erkenntnissen, Korrekturen und Wochen-/Monatskonsolidierungen.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Aktive Memories', Number(counts.active || 0), Database, 'Alle abrufbaren Langzeiteinträge'],
          ['Episodisch', Number(counts.episodic || 0), History, 'Sitzungen und konkrete Ereignisse'],
          ['Semantisch', Number(counts.semantic || 0), BrainCircuit, 'Dauerhafte biografische/therapeutische Learnings'],
          ['Hypothesen', Number(counts.hypotheses || 0), Sparkles, 'Explizit als Hypothesen markiert'],
        ].map(([label, value, Icon, hint]: any) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
              <Icon className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">{value}</div>
            <div className="text-[10px] text-slate-600 mt-1">{hint}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Thematische Langzeitsuche</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Findet auch alte Sitzungen, die nicht mehr im normalen Kurzzeitfenster liegen.</p>
          </div>
          <span className="text-[10px] text-slate-500 border border-slate-800 rounded-full px-2.5 py-1">{data.embeddingMode}</span>
        </div>
        <MemorySearch />
      </div>

      {data.corrections.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Autoritative Korrekturen
          </div>
          <p className="text-[11px] text-slate-500">Diese Einträge haben bei Widersprüchen Vorrang vor älteren Memories und Sitzungszusammenfassungen.</p>
          <div className="space-y-3">
            {data.corrections.map((correction) => (
              <div key={correction.correctionKey} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs leading-relaxed">
                <div className="text-slate-600 line-through">{correction.incorrectClaim}</div>
                <div className="text-slate-300 mt-1">{correction.correctedClaim}</div>
                {correction.reason && <div className="text-[10px] text-amber-400/70 mt-2">{correction.reason}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <History className="w-4 h-4" />
            Wochen- & Monatsverlauf
          </div>
          {data.consolidations.length > 0 ? (
            <div className="space-y-3">
              {data.consolidations.map((item) => (
                <div key={item.periodKey} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xs font-semibold text-slate-100">{item.title}</h3>
                    <span className="text-[10px] text-slate-600 shrink-0">{item.sourceCount} Quellen</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.summary}</p>
                  {item.keyChanges.length > 0 && (
                    <div className="text-[11px] text-slate-500">
                      <span className="text-teal-400">Veränderungen:</span> {item.keyChanges.join(' · ')}
                    </div>
                  )}
                  {item.openQuestions.length > 0 && (
                    <div className="text-[11px] text-slate-500">
                      <span className="text-amber-400">Offen:</span> {item.openQuestions.join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Noch keine Konsolidierung. Sie wird beim Abschluss neuer Sitzungen automatisch erstellt oder kann oben manuell angestoßen werden.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <Database className="w-4 h-4" />
            Zuletzt gespeicherte Memories
          </div>
          <div className="space-y-3">
            {data.recentMemories.map((memory) => (
              <div key={memory.memoryKey} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100">{memory.title}</h3>
                    <div className="text-[10px] text-slate-600 mt-0.5">{dateLabel(memory.occurredAt)} · {memory.memoryType}</div>
                  </div>
                  <div className="text-[10px] text-teal-500 shrink-0">Wichtigkeit {Math.round(memory.importance * 100)}%</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-5 whitespace-pre-line">{memory.content}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-600">
                  <Link2 className="w-3 h-3" />
                  <span>{memory.sourceLabel || memory.sourceType || 'strukturierte Erinnerung'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
