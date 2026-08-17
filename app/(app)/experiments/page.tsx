'use client';

import { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  Loader2,
  TrendingDown,
  TrendingUp,
  Zap,
  Flame,
  HeartHandshake,
  Award,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { MotiveCheckModal } from '@/components/experiments/motive-check-modal';

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
  libidoBefore?: number | string | null;
  libidoAfter?: number | string | null;
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

export default function ExperimentsPage() {
  const [experimentList, setExperimentList] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [showObsModal, setShowObsModal] = useState(false);
  const [showMotiveModal, setShowMotiveModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Motive checks stats
  const [motiveStats, setMotiveStats] = useState<{
    totalCount: number;
    distribution: Record<string, number>;
  }>({ totalCount: 0, distribution: {} });

  // Observation Form State
  const [triggerSituation, setTriggerSituation] = useState('');
  const [moodBefore, setMoodBefore] = useState(5.0);
  const [moodAfter, setMoodAfter] = useState(6.5);
  const [lonelinessBefore, setLonelinessBefore] = useState(7.0);
  const [lonelinessAfter, setLonelinessAfter] = useState(3.5);
  const [connectionBefore, setConnectionBefore] = useState(8.0);
  const [connectionAfter, setConnectionAfter] = useState(4.0);
  const [libidoBefore, setLibidoBefore] = useState(7.0);
  const [libidoAfter, setLibidoAfter] = useState(7.0);
  const [noveltyBefore, setNoveltyBefore] = useState(6.5);
  const [noveltyAfter, setNoveltyAfter] = useState(3.5);
  const [actionTaken, setActionTaken] = useState('');
  const [note, setNote] = useState('');

  const fetchExperiments = async () => {
    try {
      const res = await fetch('/api/experiments');
      const data = await res.json();
      if (Array.isArray(data)) {
        setExperimentList(data);
      }
    } catch {
      console.error('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const fetchMotiveChecks = async () => {
    try {
      const res = await fetch('/api/motive-checks');
      const data = await res.json();
      if (data?.distribution) {
        setMotiveStats({
          totalCount: data.totalCount || 0,
          distribution: data.distribution,
        });
      }
    } catch {
      console.error('Failed to load motive checks');
    }
  };

  useEffect(() => {
    fetchExperiments();
    fetchMotiveChecks();
  }, []);

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpId) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/experiments/${selectedExpId}/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerSituation,
          moodBefore,
          moodAfter,
          lonelinessBefore,
          lonelinessAfter,
          connectionNeedBefore: connectionBefore,
          connectionNeedAfter: connectionAfter,
          libidoBefore,
          libidoAfter,
          romanticSexualNeedBefore: libidoBefore,
          romanticSexualNeedAfter: libidoAfter,
          noveltyDriveBefore: noveltyBefore,
          noveltyDriveAfter: noveltyAfter,
          actionTaken,
          note,
        }),
      });

      if (!res.ok) throw new Error('Fehler beim Speichern der Beobachtung');

      setShowObsModal(false);
      // Reset form
      setTriggerSituation('');
      setActionTaken('');
      setNote('');
      fetchExperiments();
    } catch (err: any) {
      alert(err.message || 'Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            Phase 1 • Verhaltensexperimente & Funktionsanalyse
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Verhaltensexperimente
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Systematisches Prüfen von KVT-Arbeitshypothesen durch gezielte Vorher/Nachher-Messungen und 10s-Motiv-Snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowMotiveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>⚡ Tinder-Impuls? 10s-Motivcheck</span>
          </button>
        </div>
      </div>

      {/* Motive Decomposition Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>10s-Motiv-Stichprobe (Phase 1 Monitoring)</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Stichprobe: <strong className="text-amber-400">{motiveStats.totalCount}</strong> / 20 Impulse erfasst
          </div>
        </div>

        {/* Motive Distribution Progress Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between text-rose-400 font-medium mb-1">
              <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> Libido/Sex</span>
              <span className="font-mono font-bold">{motiveStats.distribution.sexual || 0}</span>
            </div>
            <div className="text-[10px] text-slate-500">Kein Eingriff • Normaler Sex-Trieb</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between text-purple-400 font-medium mb-1">
              <span className="flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Connection/Einsamkeit</span>
              <span className="font-mono font-bold">{(motiveStats.distribution.connection_loneliness || 0) + (motiveStats.distribution.mixed || 0)}</span>
            </div>
            <div className="text-[10px] text-slate-500">Exp 001 Trigger • Vorher/Nachher</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between text-amber-400 font-medium mb-1">
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Neuheit / Thrill</span>
              <span className="font-mono font-bold">{motiveStats.distribution.novelty_validation || 0}</span>
            </div>
            <div className="text-[10px] text-slate-500">Evidenz für spätere Phasen</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400 font-medium mb-1">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Langeweile</span>
              <span className="font-mono font-bold">{motiveStats.distribution.boredom || 0}</span>
            </div>
            <div className="text-[10px] text-slate-500">Habit- / Dopamin-Ablenkung</div>
          </div>
        </div>
      </div>

      {/* Experiments List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-purple-400" />
          <span>Lade Experimente...</span>
        </div>
      ) : experimentList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          Keine aktiven Experimente gefunden.
        </div>
      ) : (
        <div className="space-y-6">
          {experimentList.map((exp) => (
            <div
              key={exp.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {exp.status === 'active' ? 'Aktiv' : exp.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {exp.startDate} bis {exp.endDate}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                    {exp.title}
                  </h2>
                </div>

                <button
                  onClick={() => {
                    setSelectedExpId(exp.id);
                    setShowObsModal(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-purple-900/20 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Beobachtung erfassen</span>
                </button>
              </div>

              {/* Hypothesis & Prediction Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5" />
                    Arbeitshypothese
                  </span>
                  <p className="text-slate-300 leading-relaxed">{exp.hypothesis}</p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Konkrete Vorhersage
                  </span>
                  <p className="text-slate-300 leading-relaxed">{exp.prediction}</p>
                </div>
              </div>

              {/* Instructions */}
              {exp.instructions && (
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-xs space-y-1">
                  <span className="font-bold text-slate-300">Anleitung / Versuchsaufbau:</span>
                  <p className="text-slate-400 leading-relaxed">{exp.instructions}</p>
                </div>
              )}

              {/* Observations Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <h3 className="font-bold text-slate-200">
                    Protokollierte Beobachtungen ({exp.observations?.length || 0})
                  </h3>
                </div>

                {exp.observations && exp.observations.length > 0 ? (
                  <div className="space-y-3">
                    {exp.observations.map((obs) => (
                      <div
                        key={obs.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-900 pb-2">
                          <span className="font-medium text-slate-300">
                            {obs.triggerSituation || 'Akuter Impuls'}
                          </span>
                          <span className="font-mono">
                            {new Date(obs.observedAt).toLocaleString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* 5-Dimension Before / After Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Stimmung</div>
                            <div className="font-mono font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                              <span>{obs.moodBefore ?? '?'}</span>
                              <span>→</span>
                              <span className="text-emerald-400">{obs.moodAfter ?? '?'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Einsamkeit</div>
                            <div className="font-mono font-bold text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                              <span>{obs.lonelinessBefore}</span>
                              <span>→</span>
                              <span className="text-emerald-400">{obs.lonelinessAfter ?? '?'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Verbundenheit</div>
                            <div className="font-mono font-bold text-teal-400 flex items-center justify-center gap-1 mt-0.5">
                              <span>{obs.connectionNeedBefore}</span>
                              <span>→</span>
                              <span className="text-emerald-400">{obs.connectionNeedAfter ?? '?'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Libido / Sex</div>
                            <div className="font-mono font-bold text-rose-400 flex items-center justify-center gap-1 mt-0.5">
                              <span>{obs.libidoBefore ?? obs.romanticSexualNeedBefore}</span>
                              <span>→</span>
                              <span className="text-rose-400">{obs.libidoAfter ?? obs.romanticSexualNeedAfter ?? '?'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Neuheitsdrang</div>
                            <div className="font-mono font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                              <span>{obs.noveltyDriveBefore}</span>
                              <span>→</span>
                              <span className="text-emerald-400">{obs.noveltyDriveAfter ?? '?'}</span>
                            </div>
                          </div>
                        </div>

                        {obs.actionTaken && (
                          <div className="text-[11px] text-slate-300 bg-slate-900/50 p-2 rounded-lg">
                            <strong>Durchgeführte Handlung:</strong> {obs.actionTaken}
                          </div>
                        )}
                        {obs.note && (
                          <div className="text-[11px] text-slate-400 italic">
                            &ldquo;{obs.note}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/40 p-4 rounded-xl text-center text-slate-500 text-xs">
                    Noch keine Beobachtung eingetragen. Bei einem Tinder-Impuls bitte zuerst den 10s-Motivcheck durchführen!
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Motive Check Modal */}
      <MotiveCheckModal
        isOpen={showMotiveModal}
        onClose={() => setShowMotiveModal(false)}
        onSuccess={() => fetchMotiveChecks()}
        onTriggerExperiment={() => {
          if (experimentList.length > 0) {
            setSelectedExpId(experimentList[0].id);
            setShowObsModal(true);
          }
        }}
      />

      {/* Observation Modal */}
      {showObsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                <FlaskConical className="w-4 h-4" />
                <span>Experiment 001 Vorher/Nachher messen</span>
              </div>
              <button onClick={() => setShowObsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateObservation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Auslöser / Situation</label>
                <input
                  type="text"
                  required
                  value={triggerSituation}
                  onChange={(e) => setTriggerSituation(e.target.value)}
                  placeholder="z.B. Allein zu Hause, Tinder-Impuls mit Einsamkeit >= 5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Before vs After Grid */}
              <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <div className="text-[11px] font-semibold text-slate-300">Ratings (0 bis 10) – Vorher vs. Nachher:</div>

                {/* Mood Before / After */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Stimmung VORHER</span>
                      <span className="font-mono text-emerald-400">{moodBefore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={moodBefore}
                      onChange={(e) => setMoodBefore(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Stimmung NACHHER</span>
                      <span className="font-mono text-emerald-400">{moodAfter}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={moodAfter}
                      onChange={(e) => setMoodAfter(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Loneliness Before / After */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Einsamkeit VORHER</span>
                      <span className="font-mono text-indigo-400">{lonelinessBefore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={lonelinessBefore}
                      onChange={(e) => setLonelinessBefore(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-indigo-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Einsamkeit NACHHER</span>
                      <span className="font-mono text-indigo-400">{lonelinessAfter}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={lonelinessAfter}
                      onChange={(e) => setLonelinessAfter(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-indigo-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Connection Need Before / After */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Verbundenheit VORHER</span>
                      <span className="font-mono text-teal-400">{connectionBefore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={connectionBefore}
                      onChange={(e) => setConnectionBefore(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-teal-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Verbundenheit NACHHER</span>
                      <span className="font-mono text-teal-400">{connectionAfter}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={connectionAfter}
                      onChange={(e) => setConnectionAfter(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-teal-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Libido / Romantic Need Before / After */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Libido / Sex VORHER</span>
                      <span className="font-mono text-rose-400">{libidoBefore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={libidoBefore}
                      onChange={(e) => setLibidoBefore(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-rose-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Libido / Sex NACHHER</span>
                      <span className="font-mono text-rose-400">{libidoAfter}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={libidoAfter}
                      onChange={(e) => setLibidoAfter(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-rose-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Novelty Drive Before / After */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Neuheitsdrang VORHER</span>
                      <span className="font-mono text-amber-400">{noveltyBefore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={noveltyBefore}
                      onChange={(e) => setNoveltyBefore(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Neuheitsdrang NACHHER</span>
                      <span className="font-mono text-amber-400">{noveltyAfter}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={noveltyAfter}
                      onChange={(e) => setNoveltyAfter(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Action & Note */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Intervention / Durchführung</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="z.B. 20 Min. mit gutem Freund telefoniert"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Erkenntnis / Notiz</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="z.B. Einsamkeit stark gesunken, Lust auf Date/Sex ist unverändert geblieben."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowObsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Beobachtung speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
