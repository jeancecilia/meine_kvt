'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';

interface DimensionConfig {
  key: string;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
}

const dimensions: DimensionConfig[] = [
  { key: 'mood', label: 'Stimmung', description: 'Allgemeines emotionales Empfinden', lowLabel: 'Sehr gedrückt', highLabel: 'Sehr positiv' },
  { key: 'fulfillment', label: 'Erfüllung', description: 'Gefühl von Sinn und Bedeutsamkeit', lowLabel: 'Leere / Sinnlosigkeit', highLabel: 'Tiefe Erfüllung' },
  { key: 'loneliness', label: 'Einsamkeit', description: 'Empfundene soziale Isolation', lowLabel: 'Verbunden / Zugehörig', highLabel: 'Starke Einsamkeit' },
  { key: 'innerCalm', label: 'Innere Ruhe', description: 'Gelassenheit vs. Anspannung', lowLabel: 'Starke Unruhe', highLabel: 'Völlige Gelassenheit' },
  { key: 'joy', label: 'Freude', description: 'Fähigkeit, Positives zu genießen', lowLabel: 'Freudlos', highLabel: 'Starke Freude' },
  { key: 'rumination', label: 'Grübeln', description: 'Gedankenschleifen und Ruminieren', lowLabel: 'Kein Grübeln', highLabel: 'Exzessives Grübeln' },
  { key: 'futureAnxiety', label: 'Zukunftsangst', description: 'Sorgen bezüglich der Zukunft', lowLabel: 'Keine Sorgen', highLabel: 'Starke Angst' },
  { key: 'noveltyDrive', label: 'Neuheitsdrang', description: 'Reizüberflutung / Kick-Suche', lowLabel: 'Ruhebedürfnis', highLabel: 'Starker Drang' },
  { key: 'energy', label: 'Energie', description: 'Körperliches & meintales Energieniveau', lowLabel: 'Erschöpft', highLabel: 'Voller Energie' },
  { key: 'sleepQuality', label: 'Schlafqualität', description: 'Erholung in der vergangenen Nacht', lowLabel: 'Sehr schlecht', highLabel: 'Ausgezeichnet' },
];

export default function CheckInPage() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>({
    mood: 5,
    fulfillment: 5,
    loneliness: 3,
    innerCalm: 5,
    joy: 5,
    rumination: 4,
    futureAnxiety: 3,
    noveltyDrive: 4,
    energy: 5,
    sleepQuality: 6,
  });
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, note }),
      });

      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      setSubmitted(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1200);
    } catch {
      alert('Fehler beim Speichern des Check-ins');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center text-teal-400 animate-bounce">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Check-in gespeichert</h2>
        <p className="text-sm text-slate-400">Deine Werte wurden für heute erfasst.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            Tägliches Monitoring
          </div>
          <h1 className="text-2xl font-bold text-slate-100">30-Sekunden Check-In</h1>
          <p className="text-xs text-slate-400 mt-1">Bewerte deine aktuellen Empfindungen auf einer Skala von 0 bis 10.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map((dim) => {
            const val = values[dim.key];
            return (
              <div
                key={dim.key}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">{dim.label}</h3>
                    <p className="text-[11px] text-slate-400">{dim.description}</p>
                  </div>
                  <span className="text-lg font-bold font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                    {val}
                  </span>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={val}
                    onChange={(e) => handleChange(dim.key, parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{dim.lowLabel}</span>
                    <span>{dim.highLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">Freie Anmerkung (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Besondere Vorkommnisse, Auslöser oder Gedanken..."
            rows={3}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/50 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-900/30 text-xs disabled:opacity-50"
          >
            {submitting ? (
              <span>Wird gespeichert...</span>
            ) : (
              <>
                <span>Check-in Speichern</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
