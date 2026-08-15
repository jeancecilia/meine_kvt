import { db } from '@/lib/db';
import { dailyCheckins } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { TrendingUp, Activity, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const revalidate = 0;

export default async function ProgressPage() {
  const checkinList = await db.select().from(dailyCheckins).orderBy(desc(dailyCheckins.date)).limit(14).catch(() => []);
  const reversedList = [...checkinList].reverse();

  // Core metrics config
  const metrics = [
    { key: 'mood', label: 'Stimmung', color: '#10b981', baseline: 5.5 },
    { key: 'loneliness', label: 'Einsamkeit', color: '#f59e0b', baseline: 7.0 },
    { key: 'rumination', label: 'Grübeln', color: '#f43f5e', baseline: 6.5 },
    { key: 'noveltyDrive', label: 'Neuheitsdrang', color: '#a855f7', baseline: 7.0 },
    { key: 'joy', label: 'Freude / Positiver Affekt', color: '#6366f1', baseline: 4.0 },
    { key: 'fulfillment', label: 'Erfüllung / Zufriedenheit', color: '#14b8a6', baseline: 4.0 },
    { key: 'innerCalm', label: 'Innere Ruhe', color: '#0ea5e9', baseline: 5.0 },
    { key: 'energy', label: 'Energie & Antrieb', color: '#eab308', baseline: 6.0 },
    { key: 'lifeSatisfaction', label: 'Lebenszufriedenheit', color: '#2dd4bf', baseline: 5.0 },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <TrendingUp className="w-4 h-4" />
          Longitudinale Analyse
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Fortschritt & Verlaufskurven</h1>
        <p className="text-xs text-slate-400 mt-1">
          Vergleich deiner aktuellen Werte gegen die T0-Baseline zur Erfassung therapeutischer Veränderungen.
        </p>
      </div>

      {/* T0 Baseline Comparison Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          T0-Baseline vs. Aktueller Stand
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.slice(0, 6).map((m) => {
            const rawVal = checkinList[0] ? (checkinList[0] as any)[m.key] : m.baseline;
            const latestVal = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal || String(m.baseline));
            const diff = latestVal - m.baseline;

            return (
              <div key={m.key} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{m.label}</span>
                  <span className="text-[11px] text-slate-500 font-mono">T0: {m.baseline}</span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-slate-100">{latestVal}</span>
                    <span className="text-xs text-slate-500">/ 10</span>
                  </div>

                  {diff !== 0 ? (
                    <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                      (m.key === 'loneliness' || m.key === 'rumination')
                        ? diff < 0 ? 'text-emerald-400' : 'text-rose-400'
                        : diff > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {diff > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">±0.0</span>
                  )}
                </div>

                {/* Mini SVG Sparkline */}
                <div className="h-10 w-full pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke={m.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={
                        reversedList.length > 1
                          ? reversedList.map((c, i) => {
                              const x = (i / (reversedList.length - 1)) * 100;
                              const itemRaw = (c as any)[m.key];
                              const val = typeof itemRaw === 'number' ? itemRaw : parseFloat(itemRaw || String(m.baseline));
                              const y = 30 - (val / 10) * 28;
                              return `${x},${y}`;
                            }).join(' ')
                          : `0,${30 - (m.baseline / 10) * 28} 100,${30 - (latestVal / 10) * 28}`
                      }
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Insights Section */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          Klinische Trend-Hypothesen (PAT / KVT)
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1.5 leading-relaxed">
            <strong className="text-emerald-400 block font-medium">1. Belohnungsnachhall vs. Zielerreichung:</strong>
            Dein Wollen und Zielerreichungsantrieb (6–7/10) sind hoch ausgeprägt. Die Verlaufsdaten prüfen gezielt, ob gezielte PAT-Interventionen die Verweildauer im positiven Affekt nach Erfolgen verlängern.
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1.5 leading-relaxed">
            <strong className="text-purple-400 block font-medium">2. Einsamkeit als Stimulations-Trigger:</strong>
            Experiment 001 misst, ob soziale Verbundenheit ohne Dating-Komponente den Neuheitsdrang stabilisiert.
          </div>
        </div>
      </div>
    </div>
  );
}
