'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CheckCircle, ArrowRight } from 'lucide-react';

interface DimensionConfig {
  key: string;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  defaultValue: number;
}

const dimensions: DimensionConfig[] = [
  {
    key: 'mood',
    label: 'Stimmung / Wohlbefinden',
    description: 'Allgemeines emotionales Empfinden',
    lowLabel: '0 Sehr schlecht / niedergeschlagen',
    highLabel: '10 Sehr gut / ausgeglichen',
    defaultValue: 5.5,
  },
  {
    key: 'fulfillment',
    label: 'Erfüllung / Zufriedenheit',
    description: 'Sinn und Wertgefühl im Alltag',
    lowLabel: '0 Überhaupt nicht erfüllt',
    highLabel: '10 Sehr erfüllt & zufrieden',
    defaultValue: 4,
  },
  {
    key: 'loneliness',
    label: 'Einsamkeit',
    description: 'Empfundene soziale Isolation',
    lowLabel: '0 Gar nicht einsam',
    highLabel: '10 Extrem einsam',
    defaultValue: 7,
  },
  {
    key: 'innerCalm',
    label: 'Innere Ruhe',
    description: 'Gelassenheit vs. Anspannung',
    lowLabel: '0 Sehr unruhig / angespannt',
    highLabel: '10 Vollkommen ruhig & gelassen',
    defaultValue: 5,
  },
  {
    key: 'joy',
    label: 'Freude / Positiver Affekt',
    description: 'Fähigkeit, Positives zu genießen',
    lowLabel: '0 Keine Freude spürbar',
    highLabel: '10 Sehr viel Freude',
    defaultValue: 4,
  },
  {
    key: 'rumination',
    label: 'Grübeln',
    description: 'Gedankenschleifen & Ruminieren',
    lowLabel: '0 Kein Grübeln',
    highLabel: '10 Extrem viel Grübeln',
    defaultValue: 6.5,
  },
  {
    key: 'futureAnxiety',
    label: 'Zukunfts- / Existenzangst',
    description: 'Sorgen bezüglich der Zukunft',
    lowLabel: '0 Keinerlei Angst',
    highLabel: '10 Extrem starke Angst',
    defaultValue: 6,
  },
  {
    key: 'noveltyDrive',
    label: 'Neuheits- / Stimulationsdrang',
    description: 'Kick-Suche & Reizbedürfnis',
    lowLabel: '0 Kein Bedürfnis nach Neuem',
    highLabel: '10 Extrem starker Drang',
    defaultValue: 7,
  },
  {
    key: 'energy',
    label: 'Energie / Antrieb',
    description: 'Körperliches & meintales Energieniveau',
    lowLabel: '0 Völlig erschöpft',
    highLabel: '10 Extrem energiegeladen',
    defaultValue: 6,
  },
  {
    key: 'sleepQuality',
    label: 'Lebenszufriedenheit insgesamt',
    description: 'Gesamtbeurteilung des Lebens',
    lowLabel: '0 Sehr unzufrieden',
    highLabel: '10 Sehr zufrieden',
    defaultValue: 5,
  },
];

export default function CheckInPage() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>({
    mood: 5.5,
    fulfillment: 4,
    loneliness: 7,
    innerCalm: 5,
    joy: 4,
    rumination: 6.5,
    futureAnxiety: 6,
    noveltyDrive: 7,
    energy: 6,
    sleepQuality: 5,
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
            Tägliches Monitoring & T0 Baseline
          </div>
          <h1 className="text-2xl font-bold text-slate-100">30-Sekunden Check-In</h1>
          <p className="text-xs text-slate-400 mt-1">Eindeutige Endpunkte (0 bis 10) ohne Interpretationsfragen.</p>
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

                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={val}
                    onChange={(e) => handleChange(dim.key, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex justify-between text-[10px] font-medium text-slate-400">
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
