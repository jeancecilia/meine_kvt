'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  FlaskConical,
  HeartCrack,
  HeartHandshake,
  Loader2,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface MotiveCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Kept for backwards compatibility with the experiments page. The refined flow no longer
  // opens the old simultaneous before/after form because the intervention must happen first.
  onTriggerExperiment?: () => void;
}

interface MotiveItem {
  id: string;
  occurredAt: string;
  libido: string | number;
  connection: string | number;
  loneliness: string | number;
  novelty: string | number;
  validation: string | number;
  datingIntent: string | number;
  boredom: string | number;
  dominantMotive: string;
  feedbackMessage?: string | null;
  experimentStatus?: string | null;
  triggerSituation?: string | null;
  moodBefore?: number | null;
}

type RatingKey =
  | 'mood'
  | 'libido'
  | 'connection'
  | 'loneliness'
  | 'novelty'
  | 'validation'
  | 'datingIntent'
  | 'boredom';

type RatingState = Record<RatingKey, number>;

type AfterKey = 'moodAfter' | 'lonelinessAfter' | 'connectionAfter' | 'libidoAfter' | 'noveltyAfter';
type AfterState = Record<AfterKey, number>;

const initialRatings: RatingState = {
  mood: 5,
  libido: 5,
  connection: 5,
  loneliness: 5,
  novelty: 5,
  validation: 5,
  datingIntent: 5,
  boredom: 3,
};

const requiredRatingKeys: RatingKey[] = [
  'mood',
  'libido',
  'connection',
  'loneliness',
  'novelty',
  'validation',
  'datingIntent',
  'boredom',
];

const requiredAfterKeys: AfterKey[] = [
  'moodAfter',
  'lonelinessAfter',
  'connectionAfter',
  'libidoAfter',
  'noveltyAfter',
];

function RatingField({
  label,
  description,
  value,
  onChange,
  onTouch,
  touched,
  accentClass,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  onTouch: () => void;
  touched: boolean;
  accentClass: string;
}) {
  return (
    <div className={`rounded-xl border p-3 ${touched ? 'border-slate-700 bg-slate-950/70' : 'border-slate-800 bg-slate-950/45'}`}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium">
        <span className="text-slate-200">{label}</span>
        <span className={`font-mono ${touched ? 'text-slate-100' : 'text-slate-500'}`}>{value.toFixed(1)} / 10</span>
      </div>
      <p className="text-[10px] text-slate-500 mt-0.5 mb-1.5 leading-relaxed">{description}</p>
      <input
        type="range"
        min="0"
        max="10"
        step="0.5"
        value={value}
        onPointerDown={onTouch}
        onKeyDown={onTouch}
        onChange={(event) => {
          onTouch();
          onChange(Number(event.target.value));
        }}
        className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${accentClass}`}
      />
      {!touched && <div className="text-[9px] text-amber-500/80 mt-1">Bitte einmal bewusst anklicken/verschieben.</div>}
    </div>
  );
}

export function MotiveCheckModal({ isOpen, onClose, onSuccess }: MotiveCheckModalProps) {
  const [ratings, setRatings] = useState<RatingState>(initialRatings);
  const [touched, setTouched] = useState<Set<RatingKey>>(new Set());
  const [triggerSituation, setTriggerSituation] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pending, setPending] = useState<MotiveItem[]>([]);
  const [activePending, setActivePending] = useState<MotiveItem | null>(null);
  const [afterRatings, setAfterRatings] = useState<AfterState>({
    moodAfter: 5,
    lonelinessAfter: 5,
    connectionAfter: 5,
    libidoAfter: 5,
    noveltyAfter: 5,
  });
  const [afterTouched, setAfterTouched] = useState<Set<AfterKey>>(new Set());
  const [actionTaken, setActionTaken] = useState('15–30 Min. echte soziale Verbindung hergestellt');
  const [afterNote, setAfterNote] = useState('');

  const allSnapshotRated = useMemo(
    () => requiredRatingKeys.every((key) => touched.has(key)),
    [touched]
  );
  const allAfterRated = useMemo(
    () => requiredAfterKeys.every((key) => afterTouched.has(key)),
    [afterTouched]
  );

  const loadPending = async () => {
    try {
      const response = await fetch('/api/motive-checks', { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data?.pendingExperiments)) setPending(data.pendingExperiments);
    } catch {
      // The snapshot form remains usable even if the pending list cannot be loaded.
    }
  };

  useEffect(() => {
    if (isOpen) void loadPending();
  }, [isOpen]);

  if (!isOpen) return null;

  const updateRating = (key: RatingKey, value: number) => {
    setRatings((current) => ({ ...current, [key]: value }));
  };

  const markTouched = (key: RatingKey) => {
    setTouched((current) => new Set(current).add(key));
  };

  const resetSnapshot = () => {
    setRatings(initialRatings);
    setTouched(new Set());
    setTriggerSituation('');
    setNote('');
    setResult(null);
  };

  const closeModal = () => {
    resetSnapshot();
    setActivePending(null);
    setAfterTouched(new Set());
    setAfterNote('');
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!allSnapshotRated) return;
    setLoading(true);

    try {
      const response = await fetch('/api/motive-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ratings,
          appName: 'Tinder',
          triggerSituation: triggerSituation.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Speichern fehlgeschlagen');
      setResult(data);
      await loadPending();
      onSuccess?.();
    } catch (error: any) {
      alert(error?.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const startAfterRatings = (item: MotiveItem) => {
    setActivePending(item);
    setAfterRatings({
      moodAfter: Number(item.moodBefore ?? 5),
      lonelinessAfter: Number(item.loneliness),
      connectionAfter: Number(item.connection),
      libidoAfter: Number(item.libido),
      noveltyAfter: Number(item.novelty),
    });
    setAfterTouched(new Set());
    setAfterNote('');
  };

  const markAfterTouched = (key: AfterKey) => {
    setAfterTouched((current) => new Set(current).add(key));
  };

  const completePending = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activePending || !allAfterRated) return;
    setLoading(true);
    try {
      const response = await fetch('/api/motive-checks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activePending.id,
          action: 'complete',
          ...afterRatings,
          actionTaken,
          note: afterNote.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Experiment konnte nicht abgeschlossen werden');
      setActivePending(null);
      setResult(null);
      setAfterTouched(new Set());
      await loadPending();
      onSuccess?.();
    } catch (error: any) {
      alert(error?.message || 'Experiment konnte nicht abgeschlossen werden');
    } finally {
      setLoading(false);
    }
  };

  const skipPending = async (item: MotiveItem) => {
    const response = await fetch('/api/motive-checks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, action: 'skip' }),
    });
    if (response.ok) {
      if (activePending?.id === item.id) setActivePending(null);
      await loadPending();
      onSuccess?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">Dating-App-Motivcheck</h3>
              <p className="text-[10px] text-slate-500">Phase 1 · Funktion des Impulses statt pauschaler Deutung</p>
            </div>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {activePending ? (
          <form onSubmit={completePending} className="space-y-4">
            <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <HeartHandshake className="w-4 h-4 text-teal-400" /> Nach der sozialen Verbindung
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Jetzt messen wir nur, was sich tatsächlich verändert hat. Sexuelle Lust darf dabei selbstverständlich unverändert bleiben.
              </p>
              <div className="text-[10px] text-slate-500 mt-2">
                Vorher: Stimmung {activePending.moodBefore ?? '?'} · Einsamkeit {activePending.loneliness} · Verbundenheit {activePending.connection} · Libido {activePending.libido} · Neuheit {activePending.novelty}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RatingField label="Stimmung NACHHER" description="Wie ist die Stimmung jetzt?" value={afterRatings.moodAfter} touched={afterTouched.has('moodAfter')} onTouch={() => markAfterTouched('moodAfter')} onChange={(value) => setAfterRatings((c) => ({ ...c, moodAfter: value }))} accentClass="accent-emerald-500" />
              <RatingField label="Einsamkeit NACHHER" description="Wie einsam fühlst du dich jetzt?" value={afterRatings.lonelinessAfter} touched={afterTouched.has('lonelinessAfter')} onTouch={() => markAfterTouched('lonelinessAfter')} onChange={(value) => setAfterRatings((c) => ({ ...c, lonelinessAfter: value }))} accentClass="accent-indigo-500" />
              <RatingField label="Verbundenheitsbedarf NACHHER" description="Wie stark brauchst du jetzt Gesellschaft/Nähe?" value={afterRatings.connectionAfter} touched={afterTouched.has('connectionAfter')} onTouch={() => markAfterTouched('connectionAfter')} onChange={(value) => setAfterRatings((c) => ({ ...c, connectionAfter: value }))} accentClass="accent-teal-500" />
              <RatingField label="Libido / Sex NACHHER" description="Wie stark ist das sexuelle Bedürfnis jetzt?" value={afterRatings.libidoAfter} touched={afterTouched.has('libidoAfter')} onTouch={() => markAfterTouched('libidoAfter')} onChange={(value) => setAfterRatings((c) => ({ ...c, libidoAfter: value }))} accentClass="accent-rose-500" />
              <RatingField label="Neuheitsdrang NACHHER" description="Wie stark willst du jetzt noch etwas Neues/Spannendes?" value={afterRatings.noveltyAfter} touched={afterTouched.has('noveltyAfter')} onTouch={() => markAfterTouched('noveltyAfter')} onChange={(value) => setAfterRatings((c) => ({ ...c, noveltyAfter: value }))} accentClass="accent-amber-500" />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Was hast du tatsächlich gemacht?</label>
              <input value={actionTaken} onChange={(event) => setActionTaken(event.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-teal-500/50" />
            </div>
            <textarea value={afterNote} onChange={(event) => setAfterNote(event.target.value)} rows={2} placeholder="Optional: Was ist dir aufgefallen?" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none resize-none" />

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" disabled={loading || !allAfterRated} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Experiment abschließen
              </button>
              <button type="button" onClick={() => skipPending(activePending)} className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white">Überspringen</button>
            </div>
          </form>
        ) : result ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${result.experimentTriggered ? 'bg-purple-950/40 border-purple-800/60' : result.dominantMotive === 'sexual' ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-blue-950/40 border-blue-800/60'}`}>
              <div className="flex items-start gap-3">
                {result.experimentTriggered ? <FlaskConical className="w-6 h-6 text-purple-400 shrink-0" /> : result.dominantMotive === 'sexual' ? <Flame className="w-6 h-6 text-emerald-400 shrink-0" /> : <Sparkles className="w-6 h-6 text-blue-400 shrink-0" />}
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{result.dominantMotiveLabel || 'Motiv-Snapshot erfasst'}</h4>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">{result.feedbackMessage}</p>
                </div>
              </div>
            </div>

            {result.experimentTriggered ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="text-xs font-semibold text-teal-300">Experiment 001 ist jetzt als offen gespeichert.</div>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                  <li>15–30 Minuten echte soziale Verbindung herstellen.</li>
                  <li>Erst danach die Nachher-Werte eintragen.</li>
                  <li>Danach ist Dating/Tinder weiterhin völlig offen.</li>
                </ol>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button onClick={() => startAfterRatings(result.motiveCheck)} className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white flex items-center justify-center gap-2">
                    Ich habe inzwischen gesprochen <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={closeModal} className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700">Später fortsetzen</button>
                </div>
              </div>
            ) : (
              <button onClick={closeModal} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200">
                Fertig & schließen
              </button>
            )}
            <button onClick={resetSnapshot} className="w-full text-[11px] text-slate-500 hover:text-slate-300">Neuen Snapshot erfassen</button>
          </div>
        ) : (
          <div className="space-y-5">
            {pending.length > 0 && (
              <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-300"><CheckCircle2 className="w-4 h-4" /> Offener Connection-Test</div>
                {pending.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/70 pt-2 first:border-0 first:pt-0">
                    <div className="text-[11px] text-slate-400">Einsamkeit {item.loneliness} · Connection {item.connection} · Libido {item.libido} · Neuheit {item.novelty}</div>
                    <button onClick={() => startAfterRatings(item)} className="text-[11px] px-3 py-1.5 rounded-lg bg-teal-600 text-white">Nachher-Werte</button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Keine Deutung vorab:</strong> Der gleiche Tinder-/Dating-Impuls kann Sex, Verbundenheit, Neuheit, Bestätigung, echtes Dating-Interesse oder Langeweile bedeuten. Mehrere Motive dürfen gleichzeitig hoch sein.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RatingField label="Stimmung" description="Kontextwert für einen möglichen Vorher/Nachher-Test." value={ratings.mood} touched={touched.has('mood')} onTouch={() => markTouched('mood')} onChange={(value) => updateRating('mood', value)} accentClass="accent-emerald-500" />
                <RatingField label="Sex / Libido" description="Wie stark willst du gerade tatsächlich Sex/körperliche Nähe?" value={ratings.libido} touched={touched.has('libido')} onTouch={() => markTouched('libido')} onChange={(value) => updateRating('libido', value)} accentClass="accent-rose-500" />
                <RatingField label="Verbundenheit / Nähe" description="Wie stark willst du Gesellschaft, Gespräch oder emotionale Nähe?" value={ratings.connection} touched={touched.has('connection')} onTouch={() => markTouched('connection')} onChange={(value) => updateRating('connection', value)} accentClass="accent-teal-500" />
                <RatingField label="Einsamkeit" description="Wie einsam oder isoliert fühlst du dich gerade?" value={ratings.loneliness} touched={touched.has('loneliness')} onTouch={() => markTouched('loneliness')} onChange={(value) => updateRating('loneliness', value)} accentClass="accent-indigo-500" />
                <RatingField label="Neuheit / Kick" description="Wie stark willst du Neues, Spannung oder eine neue Person?" value={ratings.novelty} touched={touched.has('novelty')} onTouch={() => markTouched('novelty')} onChange={(value) => updateRating('novelty', value)} accentClass="accent-amber-500" />
                <RatingField label="Bestätigung" description="Wie stark möchtest du dich begehrt/gematcht/bestätigt fühlen?" value={ratings.validation} touched={touched.has('validation')} onTouch={() => markTouched('validation')} onChange={(value) => updateRating('validation', value)} accentClass="accent-violet-500" />
                <RatingField label="Dating / Beziehung" description="Wie stark möchtest du wirklich eine interessante Person kennenlernen?" value={ratings.datingIntent} touched={touched.has('datingIntent')} onTouch={() => markTouched('datingIntent')} onChange={(value) => updateRating('datingIntent', value)} accentClass="accent-pink-500" />
                <RatingField label="Langeweile / Ablenkung" description="Wie stark ist es bloß Beschäftigung, Gewohnheit oder Ablenkung?" value={ratings.boredom} touched={touched.has('boredom')} onTouch={() => markTouched('boredom')} onChange={(value) => updateRating('boredom', value)} accentClass="accent-slate-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Situation (optional)</label>
                  <input value={triggerSituation} onChange={(event) => setTriggerSituation(event.target.value)} placeholder="z.B. Montagabend allein zu Hause" className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Notiz (optional)</label>
                  <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="kurzer Kontext" className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none" />
                </div>
              </div>

              {!allSnapshotRated && (
                <div className="text-[10px] text-amber-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Bitte jede Skala einmal bewusst anklicken. Damit lösen die 5/10-Startpositionen kein Experiment versehentlich aus.</div>
              )}

              <button type="submit" disabled={loading || !allSnapshotRated} className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Speichere…</> : 'Motiv-Snapshot speichern'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
