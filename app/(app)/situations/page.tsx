'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Plus,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  Loader2,
  Calendar,
} from 'lucide-react';

interface SituationItem {
  id: string;
  occurredAt: string;
  title: string;
  category: string;
  objectiveEvent: string;
  expectation: string | null;
  actualFeeling: string | null;
  emotionRatings: string | Record<string, number> | null;
  automaticThoughts: string;
  behaviorReaction: string;
  shortTermConsequence: string | null;
  longTermConsequence: string | null;
  aiAnalysis: string | null;
}

export default function SituationsPage() {
  const [situationsList, setSituationsList] = useState<SituationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Alltag & Emotionen');
  const [objectiveEvent, setObjectiveEvent] = useState('');
  const [expectation, setExpectation] = useState('');
  const [actualFeeling, setActualFeeling] = useState('');
  const [lonelinessRating, setLonelinessRating] = useState(5);
  const [melancholyRating, setMelancholyRating] = useState(5);
  const [automaticThoughts, setAutomaticThoughts] = useState('');
  const [behaviorReaction, setBehaviorReaction] = useState('');
  const [shortTermConsequence, setShortTermConsequence] = useState('');
  const [longTermConsequence, setLongTermConsequence] = useState('');

  const fetchSituations = async () => {
    try {
      const res = await fetch('/api/situations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSituationsList(data);
      }
    } catch {
      console.error('Failed to load situations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSituations();
  }, []);

  const handleCreateSituation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Situationsanalyse',
          category,
          objectiveEvent,
          expectation,
          actualFeeling,
          emotionRatings: {
            loneliness: lonelinessRating,
            melancholy: melancholyRating,
          },
          automaticThoughts,
          behaviorReaction,
          shortTermConsequence,
          longTermConsequence,
          aiAnalysis: `KVT-Reflexion: Diskrepanz zwischen Erwartung (${expectation || 'keine Angabe'}) und Erleben wurde mit Verhalten (${behaviorReaction || 'keine Angabe'}) beantwortet.`,
        }),
      });

      if (!res.ok) throw new Error('Speichern fehlgeschlagen');

      setShowModal(false);
      // Reset form
      setTitle('');
      setObjectiveEvent('');
      setExpectation('');
      setActualFeeling('');
      setAutomaticThoughts('');
      setBehaviorReaction('');
      setShortTermConsequence('');
      setLongTermConsequence('');
      fetchSituations();
    } catch {
      alert('Fehler beim Speichern der Situation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4" />
            Funktionale KVT-Analyse
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Situations- & Kognitionsanalyse</h1>
          <p className="text-xs text-slate-400 mt-1">
            Strukturierte 5-Punkte-KVT-Erfassung zur Aufdeckung automatischer Gedanken und Verhaltensketten.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Situation festhalten</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Lade Situationen...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {situationsList.map((sit) => {
            let ratings: Record<string, number> = {};
            if (typeof sit.emotionRatings === 'object' && sit.emotionRatings !== null) {
              ratings = sit.emotionRatings as Record<string, number>;
            } else if (typeof sit.emotionRatings === 'string') {
              try {
                ratings = JSON.parse(sit.emotionRatings);
              } catch {
                ratings = {};
              }
            }

            return (
              <div key={sit.id} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-lg">
                    {sit.category} • {sit.title}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(sit.occurredAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-100">{sit.objectiveEvent}</p>
                  {sit.aiAnalysis && (
                    <div className="flex items-start gap-2 bg-teal-500/5 border border-teal-500/15 p-3 rounded-xl text-xs text-teal-300">
                      <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{sit.aiAnalysis}</span>
                    </div>
                  )}
                </div>

                {/* 5-Step Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                    <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">1. Erwartung vs. Erleben</div>
                    <div className="text-slate-300">
                      <strong>Erwartung:</strong> {sit.expectation || 'Keine Angabe'}<br />
                      <strong>Gefühl:</strong> {sit.actualFeeling || 'Keine Angabe'}
                      {ratings.loneliness !== undefined && (
                        <div className="mt-1 flex gap-2 text-[11px] text-amber-400 font-mono">
                          <span>Einsamkeit: {ratings.loneliness}/10</span>
                          {ratings.melancholy !== undefined && <span>Melancholie: {ratings.melancholy}/10</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                    <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">2. Automatischer Gedanke</div>
                    <div className="text-amber-200 italic font-mono text-[11px] bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      &ldquo;{sit.automaticThoughts}&rdquo;
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                    <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">3. Reaktion / Verhalten</div>
                    <div className="text-slate-200">{sit.behaviorReaction}</div>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
                    <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">4. Konsequenzen</div>
                    <div className="text-slate-300">
                      <div><strong>Kurzfristig:</strong> {sit.shortTermConsequence || 'Ablenkung'}</div>
                      <div><strong>Langfristig:</strong> {sit.longTermConsequence || 'Aufrechterhaltung des Musters'}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>In Fallformulierung integriert</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Neue Situation protokollieren (5 KVT-Schritte)</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSituation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Titel der Situation</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z.B. Allein am Samstagabend"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Kategorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-amber-500/50"
                  >
                    <option value="Erfolg & Einsamkeit">Erfolg & Einsamkeit</option>
                    <option value="Beziehung & Dating">Beziehung & Dating</option>
                    <option value="Arbeit & Leistung">Arbeit & Leistung</option>
                    <option value="Alltag & Emotionen">Alltag & Emotionen</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">1. Objektives Ereignis (Was ist passiert?)</label>
                <textarea
                  required
                  rows={2}
                  value={objectiveEvent}
                  onChange={(e) => setObjectiveEvent(e.target.value)}
                  placeholder="Wo warst du, was hast du gemacht, wer war dabei?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">2. Erwartung (Wie hättest du dich fühlen sollen?)</label>
                  <input
                    type="text"
                    value={expectation}
                    onChange={(e) => setExpectation(e.target.value)}
                    placeholder="z.B. Eigentlich müsste ich glücklich sein"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">3. Tatsächliches Gefühl</label>
                  <input
                    type="text"
                    value={actualFeeling}
                    onChange={(e) => setActualFeeling(e.target.value)}
                    placeholder="z.B. Einsamkeit, Melancholie, Leere"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Einsamkeit</span>
                    <span className="font-mono font-bold text-amber-400">{lonelinessRating}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={lonelinessRating}
                    onChange={(e) => setLonelinessRating(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg accent-amber-400 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Melancholie</span>
                    <span className="font-mono font-bold text-indigo-400">{melancholyRating}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={melancholyRating}
                    onChange={(e) => setMelancholyRating(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg accent-indigo-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">4. Automatischer Gedanke (Möglichst wortwörtlich)</label>
                <input
                  type="text"
                  required
                  value={automaticThoughts}
                  onChange={(e) => setAutomaticThoughts(e.target.value)}
                  placeholder="z.B. Niemanden zum Reden, ich sollte einer alten Flamme schreiben..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">5. Reaktion / Verhalten (Was hast du gemacht?)</label>
                <input
                  type="text"
                  required
                  value={behaviorReaction}
                  onChange={(e) => setBehaviorReaction(e.target.value)}
                  placeholder="z.B. Tinder geöffnet, Dating-Standort geändert, abgelenkt..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-5 py-2 rounded-xl font-medium shadow-lg shadow-amber-900/30 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Situation speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
