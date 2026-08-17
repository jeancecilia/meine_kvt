'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';

interface Observation {
  id: string;
  observedAt: string;
  triggerSituation: string | null;
  moodBefore: number | string | null;
  moodAfter: number | string | null;
  lonelinessBefore: number | string;
  lonelinessAfter: number | string | null;
  connectionNeedBefore: number | string;
  connectionNeedAfter: number | string | null;
  romanticSexualNeedBefore: number | string;
  romanticSexualNeedAfter: number | string | null;
  noveltyDriveBefore: number | string;
  noveltyDriveAfter: number | string | null;
  actionTaken: string | null;
  note: string | null;
}

interface ExperimentItem {
  id: string;
  title: string;
  hypothesis: string;
  prediction: string;
  instructions: string | null;
  startDate: string;
  endDate: string;
  status: string;
  observations?: Observation[];
}

function Delta({ label, before, after }: { label: string; before: string | number | null; after: string | number | null }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-center">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="font-mono font-bold text-slate-200 mt-0.5">
        {before ?? '?'} <span className="text-slate-600">→</span> <span className="text-emerald-400">{after ?? '?'}</span>
      </div>
    </div>
  );
}

export default function ExperimentsPage() {
  const [experimentList, setExperimentList] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/experiments', { cache: 'no-store' });
        const data = await response.json();
        if (Array.isArray(data)) setExperimentList(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <FlaskConical className="w-4 h-4" /> Verhaltensexperimente
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Aktive & geplante Experimente</h1>
        <p className="text-xs text-slate-400 mt-1">Hypothesen werden durch reale Situationen geprüft, nicht durch pauschale Interpretation einzelner Verhaltensweisen.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> Experimente werden geladen…
        </div>
      ) : (
        <div className="space-y-6">
          {experimentList.map((experiment) => (
            <div key={experiment.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-400" />
                  <h2 className="font-bold text-slate-100">{experiment.title}</h2>
                </div>
                <span className={`self-start text-[11px] px-2.5 py-0.5 rounded-full border ${experiment.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {experiment.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Arbeitshypothese</div>
                  <div className="text-slate-300 leading-relaxed">{experiment.hypothesis}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Vorhersage</div>
                  <div className="text-slate-300 leading-relaxed">{experiment.prediction}</div>
                </div>
              </div>

              {experiment.instructions && (
                <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-4 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-300 mb-2"><Sparkles className="w-4 h-4" /> Vorgehen</div>
                  <p className="text-slate-300 leading-relaxed">{experiment.instructions}</p>
                </div>
              )}

              {experiment.id === 'exp-001' && experiment.status === 'active' && (
                <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-100"><Search className="w-4 h-4 text-teal-400" /> Erst Motiv, dann Intervention</div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-2xl">Bei jedem realen Dating-/Tinder-Impuls zunächst Libido, Verbundenheit, Einsamkeit, Neuheit, Bestätigung, Dating-Interesse und Langeweile trennen. Nur relevante Einsamkeit/Verbundenheit löst den Connection-Test aus.</p>
                  </div>
                  <Link href="/motive-check" className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-xs font-semibold text-white">
                    Motivcheck starten <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Abgeschlossene Connection-Tests</h3>
                  <span className="text-[11px] text-slate-500">{experiment.observations?.length || 0} Beobachtungen</span>
                </div>

                {experiment.observations && experiment.observations.length > 0 ? (
                  <div className="space-y-3">
                    {experiment.observations.map((observation) => (
                      <div key={observation.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2 font-semibold text-slate-200"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {observation.triggerSituation || 'Dating-/Tinder-Impuls'}</div>
                          <div className="text-[10px] text-slate-500">{new Date(observation.observedAt).toLocaleString('de-DE')}</div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <Delta label="Stimmung" before={observation.moodBefore} after={observation.moodAfter} />
                          <Delta label="Einsamkeit" before={observation.lonelinessBefore} after={observation.lonelinessAfter} />
                          <Delta label="Verbundenheit" before={observation.connectionNeedBefore} after={observation.connectionNeedAfter} />
                          <Delta label="Libido / Sex" before={observation.romanticSexualNeedBefore} after={observation.romanticSexualNeedAfter} />
                          <Delta label="Neuheit" before={observation.noveltyDriveBefore} after={observation.noveltyDriveAfter} />
                        </div>
                        {observation.actionTaken && <div className="rounded-lg bg-slate-900/70 p-2 text-[11px] text-slate-400"><strong className="text-slate-300">Handlung:</strong> {observation.actionTaken}</div>}
                        {observation.note && <div className="text-[11px] text-slate-500 italic">{observation.note}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center text-xs text-slate-500">Noch kein Connection-Test abgeschlossen. Reine Libido-/Neuheits-/Dating-Motive werden im Motivcheck trotzdem als wichtige Gegenbeispiele gespeichert.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
