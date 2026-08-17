'use client';

import { useState } from 'react';
import {
  Flame,
  HeartHandshake,
  HeartCrack,
  Sparkles,
  Award,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  FlaskConical,
  Zap,
} from 'lucide-react';

interface MotiveCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onTriggerExperiment?: () => void;
}

export function MotiveCheckModal({
  isOpen,
  onClose,
  onSuccess,
  onTriggerExperiment,
}: MotiveCheckModalProps) {
  const [libido, setLibido] = useState(5.0);
  const [connection, setConnection] = useState(5.0);
  const [loneliness, setLoneliness] = useState(5.0);
  const [novelty, setNovelty] = useState(5.0);
  const [validation, setValidation] = useState(5.0);
  const [datingIntent, setDatingIntent] = useState(5.0);
  const [boredom, setBoredom] = useState(3.0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/motive-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libido,
          connection,
          loneliness,
          novelty,
          validation,
          datingIntent,
          boredom,
          appName: 'Tinder',
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      const data = await res.json();
      setResult(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-teal-400">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">
              10s Tinder-Motivcheck
            </h3>
          </div>
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          /* Result Feedback Card */
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div
              className={`p-4 rounded-xl border ${
                result.experimentTriggered
                  ? 'bg-purple-950/40 border-purple-800/60 text-purple-200'
                  : result.dominantMotive === 'sexual'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-blue-950/40 border-blue-800/60 text-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.experimentTriggered ? (
                  <FlaskConical className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                ) : result.dominantMotive === 'sexual' ? (
                  <Flame className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-100">
                    {result.experimentTriggered
                      ? '🧪 Experiment 001 empfohlen (Motive Decomposition)'
                      : result.dominantMotive === 'sexual'
                      ? '🟢 Reines Libido-Motiv (Kein Eingriff)'
                      : '📊 Beobachtung erfasst'}
                  </h4>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                    {result.feedbackMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions based on result */}
            <div className="pt-2 flex flex-col gap-2">
              {result.experimentTriggered && onTriggerExperiment && (
                <button
                  onClick={() => {
                    handleReset();
                    onTriggerExperiment();
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all"
                >
                  <FlaskConical className="w-4 h-4" />
                  Experiment 001 Vorher/Nachher starten
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all"
              >
                Fertig & Schließen
              </button>
            </div>
          </div>
        ) : (
          /* Form for 10-second motive snapshot */
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-400">
              Kurzer 10-Sekunden-Snapshot vor dem Öffnen: <em>Welche Funktion hat Tinder genau in diesem Moment?</em> Mehrere Motive dürfen gleichzeitig hoch sein.
            </p>

            <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
              {/* 1. Sex / Libido */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <Flame className="w-3.5 h-3.5" /> 1. Sex / Libido
                  </span>
                  <span className="font-mono text-rose-400">{libido.toFixed(1)} / 10</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">
                  Wie stark will ich gerade tatsächlich Sex / körperliche Nähe?
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={libido}
                  onChange={(e) => setLibido(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* 2. Verbundenheit */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5 text-teal-400">
                    <HeartHandshake className="w-3.5 h-3.5" /> 2. Verbundenheit / Nähe
                  </span>
                  <span className="font-mono text-teal-400">{connection.toFixed(1)} / 10</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">
                  Wie stark will ich jemanden zum Reden, emotionale Nähe, Gesellschaft?
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={connection}
                  onChange={(e) => setConnection(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              {/* 3. Einsamkeit */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <HeartCrack className="w-3.5 h-3.5" /> 3. Einsamkeit
                  </span>
                  <span className="font-mono text-indigo-400">{loneliness.toFixed(1)} / 10</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">
                  Wie einsam / isoliert fühle ich mich gerade?
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={loneliness}
                  onChange={(e) => setLoneliness(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* 4. Neuheit / Kick */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" /> 4. Neuheit / Stimulation
                  </span>
                  <span className="font-mono text-amber-400">{novelty.toFixed(1)} / 10</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">
                  Wie stark will ich etwas Neues, Spannendes, eine neue Person / Kick?
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={novelty}
                  onChange={(e) => setNovelty(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* 5. Bestätigung */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5 text-violet-400">
                    <Award className="w-3.5 h-3.5" /> 5. Bestätigung
                  </span>
                  <span className="font-mono text-violet-400">{validation.toFixed(1)} / 10</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">
                  Wie stark möchte ich begehrt / gematcht / bestätigt werden?
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={validation}
                  onChange={(e) => setValidation(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              {/* 6. Dating / Beziehung */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5 text-pink-400">
                    <Users className="w-3.5 h-3.5" /> 6. Dating-Absicht
                  </span>
                  <span className="font-mono text-pink-400">{datingIntent.toFixed(1)} / 10</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">
                  Wie stark möchte ich tatsächlich eine interessante Person kennenlernen?
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={datingIntent}
                  onChange={(e) => setDatingIntent(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              {/* 7. Langeweile */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-200 mb-1">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> 7. Langeweile / Ablenkung
                  </span>
                  <span className="font-mono text-slate-400">{boredom.toFixed(1)} / 10</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">
                  Wie stark öffne ich die App einfach als Gewohnheit / Dopamin-Ablenkung?
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={boredom}
                  onChange={(e) => setBoredom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition-all"
            >
              {loading ? 'Klassifiziere...' : 'Motiv-Snapshot speichern (10s)'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
