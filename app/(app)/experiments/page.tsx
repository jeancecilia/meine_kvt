'use client';

import { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  TrendingDown,
  Loader2,
  Calendar,
} from 'lucide-react';

interface Observation {
  id: string;
  observedAt: string;
  triggerSituation: string | null;
  lonelinessBefore: number;
  lonelinessAfter: number | null;
  connectionNeedBefore: number;
  connectionNeedAfter: number | null;
  romanticSexualNeedBefore: number;
  romanticSexualNeedAfter: number | null;
  noveltyDriveBefore: number;
  noveltyDriveAfter: number | null;
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
  const [submitting, setSubmitting] = useState(false);

  // Observation Form State
  const [triggerSituation, setTriggerSituation] = useState('');
  const [lonelinessBefore, setLonelinessBefore] = useState(7);
  const [lonelinessAfter, setLonelinessAfter] = useState(3);
  const [connectionBefore, setConnectionBefore] = useState(8);
  const [connectionAfter, setConnectionAfter] = useState(4);
  const [romanticBefore, setRomanticBefore] = useState(7);
  const [romanticAfter, setRomanticAfter] = useState(3);
  const [noveltyBefore, setNoveltyBefore] = useState(6);
  const [noveltyAfter, setNoveltyAfter] = useState(3);
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

  useEffect(() => {
    fetchExperiments();
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
          lonelinessBefore,
          lonelinessAfter,
          connectionNeedBefore: connectionBefore,
          connectionNeedAfter: connectionAfter,
          romanticSexualNeedBefore: romanticBefore,
          romanticSexualNeedAfter: romanticAfter,
          noveltyDriveBefore: noveltyBefore,
          noveltyDriveAfter: noveltyAfter,
          actionTaken,
          note,
        }),
      });

      if (!res.ok) throw new Error('Speichern fehlgeschlagen');

      setShowObsModal(false);
      // Reset form
      setTriggerSituation('');
      setActionTaken('');
      setNote('');
      fetchExperiments();
    } catch {
      alert('Fehler beim Speichern der Beobachtung');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            Verhaltensexperimente
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Aktive & Geplante Experimente</h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirische Überprüfung von Annahmen und Verhaltensmustern im Alltag.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          <span>Lade Experimente...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {experimentList.map((exp) => (
            <div key={exp.id} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-lg flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                  <span>{exp.title}</span>
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  {exp.status === 'active' ? 'Aktiv (Laufzeit 7 Tage)' : exp.status}
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

              {exp.instructions && (
                <div className="bg-purple-500/5 border border-purple-500/15 p-4 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Konkreter Handlungsauftrag:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{exp.instructions}</p>
                </div>
              )}

              {/* Logged Observations Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Protokollierte Beobachtungen ({exp.observations?.length || 0})
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedExpId(exp.id);
                      setShowObsModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-xl shadow-lg shadow-purple-900/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Beobachtung hinzufügen</span>
                  </button>
                </div>

                {exp.observations && exp.observations.length > 0 ? (
                  <div className="space-y-3">
                    {exp.observations.map((obs) => (
                      <div key={obs.id} className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-200">
                            {obs.triggerSituation || 'Einsamkeitsimpuls'}
                          </span>
                          <span>{new Date(obs.observedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Rating Deltas Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Einsamkeit</div>
                            <div className="font-mono font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                              <span>{obs.lonelinessBefore}</span>
                              <span>→</span>
                              <span className="text-emerald-400">{obs.lonelinessAfter ?? '?'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Connection Need</div>
                            <div className="font-mono font-bold text-sky-400 flex items-center justify-center gap-1 mt-0.5">
                              <span>{obs.connectionNeedBefore}</span>
                              <span>→</span>
                              <span className="text-emerald-400">{obs.connectionNeedAfter ?? '?'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Romantik/Frau</div>
                            <div className="font-mono font-bold text-rose-400 flex items-center justify-center gap-1 mt-0.5">
                              <span>{obs.romanticSexualNeedBefore}</span>
                              <span>→</span>
                              <span className="text-emerald-400">{obs.romanticSexualNeedAfter ?? '?'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Neuheitsdrang</div>
                            <div className="font-mono font-bold text-purple-400 flex items-center justify-center gap-1 mt-0.5">
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/40 p-4 rounded-xl text-center text-slate-500 text-xs">
                    Noch keine Beobachtung eingetragen. Klicke auf „Beobachtung hinzufügen“, sobald du Einsamkeit bemerkst.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Observation Modal */}
      {showObsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                <FlaskConical className="w-4 h-4" />
                <span>Experiment-Beobachtung erfassen</span>
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
                  placeholder="z.B. Allein zu Hause, Impuls Tinder zu öffnen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Before vs After Grid */}
              <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <div className="text-[11px] font-semibold text-slate-300">Ratings (0 bis 10) – Vorher vs. Nachher:</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Einsamkeit VORHER</span>
                      <span className="font-mono text-amber-400">{lonelinessBefore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={lonelinessBefore}
                      onChange={(e) => setLonelinessBefore(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Einsamkeit NACHHER</span>
                      <span className="font-mono text-emerald-400">{lonelinessAfter}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={lonelinessAfter}
                      onChange={(e) => setLonelinessAfter(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Connection Need VOR</span>
                      <span className="font-mono text-sky-400">{connectionBefore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={connectionBefore}
                      onChange={(e) => setConnectionBefore(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Connection Need NACH</span>
                      <span className="font-mono text-emerald-400">{connectionAfter}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={connectionAfter}
                      onChange={(e) => setConnectionAfter(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Romantik / Frau VOR</span>
                      <span className="font-mono text-rose-400">{romanticBefore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={romanticBefore}
                      onChange={(e) => setRomanticBefore(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-rose-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Romantik / Frau NACH</span>
                      <span className="font-mono text-emerald-400">{romanticAfter}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={romanticAfter}
                      onChange={(e) => setRomanticAfter(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Neuheitsdrang VOR</span>
                      <span className="font-mono text-purple-400">{noveltyBefore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={noveltyBefore}
                      onChange={(e) => setNoveltyBefore(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-purple-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Neuheitsdrang NACH</span>
                      <span className="font-mono text-emerald-400">{noveltyAfter}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={noveltyAfter}
                      onChange={(e) => setNoveltyAfter(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Durchgeführte soziale Verbindung</label>
                <input
                  type="text"
                  required
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="z.B. 20 Min. mit gutem Freund telefoniert"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Notiz / Erkenntnis (Optional)</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Wie ging es dir danach? War danach noch Drang nach Tinder da?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowObsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl font-medium shadow-lg shadow-purple-900/30 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
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
