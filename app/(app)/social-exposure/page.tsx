'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, ShieldCheck, Plus, Loader2, Brain, CheckCircle2 } from 'lucide-react';

type ExposureLog = {
  id: string;
  occurred_at: string;
  context: string | null;
  target_type: string;
  purposes: string[] | null;
  fear_prediction: string | null;
  social_anxiety_before: string | number;
  expected_rejection_before: string | number;
  avoidance_urge_before: string | number;
  pressure_to_approach_before: string | number;
  choice_freedom_before: string | number;
  performed: boolean;
  action_description: string | null;
  people_approached: number;
  safety_behaviors: string | null;
  social_anxiety_after: string | number | null;
  actual_outcome: string | null;
  outcome_details: string | null;
  choice_freedom_after: string | number | null;
  learning: string | null;
};

const purposeOptions = [
  ['exposure', 'Soziale Exposition / Angsttraining'],
  ['social_skill', 'Soziale Kompetenz üben'],
  ['curiosity', 'Echte Neugier / Gesprächslust'],
  ['connection', 'Kontakt / Verbundenheit'],
  ['dating', 'Dating / Flirt'],
  ['fun', 'Spaß / Spontaneität'],
] as const;

const targetOptions = [
  ['stranger', 'Fremde Person'],
  ['attractive_person', 'Attraktive Person'],
  ['group', 'Gruppe'],
  ['authority', 'Autoritäts-/Statusperson'],
  ['service', 'Service / Alltag'],
  ['public_speaking', 'Vor Gruppe sprechen'],
  ['other', 'Andere Situation'],
] as const;

const outcomeLabels: Record<string, string> = {
  positive: 'positiv',
  neutral: 'neutral',
  negative: 'negativ',
  mixed: 'gemischt',
  not_attempted: 'nicht durchgeführt',
};

function Slider({ label, value, setValue, low, high }: { label: string; value: number; setValue: (v: number) => void; low: string; high: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="font-mono text-teal-400">{value.toFixed(1)} / 10</span>
      </div>
      <input type="range" min="0" max="10" step="0.5" value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full accent-teal-500" />
      <div className="flex justify-between text-[10px] text-slate-500"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export default function SocialExposurePage() {
  const [items, setItems] = useState<ExposureLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const [context, setContext] = useState('');
  const [targetType, setTargetType] = useState('stranger');
  const [purposes, setPurposes] = useState<string[]>(['exposure']);
  const [fearPrediction, setFearPrediction] = useState('');
  const [socialAnxietyBefore, setSocialAnxietyBefore] = useState(5);
  const [expectedRejectionBefore, setExpectedRejectionBefore] = useState(5);
  const [avoidanceUrgeBefore, setAvoidanceUrgeBefore] = useState(5);
  const [pressureToApproachBefore, setPressureToApproachBefore] = useState(2);
  const [choiceFreedomBefore, setChoiceFreedomBefore] = useState(7);
  const [performed, setPerformed] = useState(true);
  const [actionDescription, setActionDescription] = useState('');
  const [peopleApproached, setPeopleApproached] = useState(1);
  const [safetyBehaviors, setSafetyBehaviors] = useState('');
  const [socialAnxietyAfter, setSocialAnxietyAfter] = useState(3);
  const [actualOutcome, setActualOutcome] = useState('neutral');
  const [outcomeDetails, setOutcomeDetails] = useState('');
  const [choiceFreedomAfter, setChoiceFreedomAfter] = useState(8);
  const [learning, setLearning] = useState('');

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/social-exposures', { cache: 'no-store' });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const exposureCount = useMemo(() => items.filter((item) => item.performed).length, [items]);

  const togglePurpose = (value: string) => {
    setPurposes((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/social-exposures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context, targetType, purposes, fearPrediction,
          socialAnxietyBefore, expectedRejectionBefore, avoidanceUrgeBefore,
          pressureToApproachBefore, choiceFreedomBefore,
          performed, actionDescription, peopleApproached, safetyBehaviors,
          socialAnxietyAfter: performed ? socialAnxietyAfter : null,
          actualOutcome: performed ? actualOutcome : 'not_attempted',
          outcomeDetails, choiceFreedomAfter: performed ? choiceFreedomAfter : null,
          learning,
        }),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      setContext('');
      setFearPrediction('');
      setActionDescription('');
      setSafetyBehaviors('');
      setOutcomeDetails('');
      setLearning('');
      await fetchItems();
      setShowForm(false);
    } catch (error: any) {
      alert(error?.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> KVT · reale soziale Annäherung
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Soziale Exposition</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Reales Leute-Ansprechen wird hier als eigene Funktion betrachtet – nicht automatisch als Einsamkeits- oder Neuheitssuche. Ziel ist Wahlfreiheit: ansprechen können, ohne dass Angst oder ein selbst auferlegter Leistungszwang entscheidet.
          </p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold hover:bg-sky-500/15">
          <Plus className="w-4 h-4" /> {showForm ? 'Formular schließen' : 'Exposition protokollieren'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4"><div className="text-[10px] uppercase text-slate-500">Logs</div><div className="text-2xl font-bold text-slate-100 mt-1">{items.length}</div></div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4"><div className="text-[10px] uppercase text-slate-500">durchgeführt</div><div className="text-2xl font-bold text-emerald-400 mt-1">{exposureCount}</div></div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4"><div className="text-[10px] uppercase text-slate-500">Prinzip</div><div className="text-sm font-semibold text-sky-300 mt-1">Funktion vor Interpretation</div></div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2"><Brain className="w-4 h-4 text-sky-400" /> 1. Situation & Zweck</h2>
            <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Wo / was war die Situation? z. B. Mall, Café, Veranstaltung" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-500/50" />
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200">
              {targetOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <div>
              <div className="text-xs text-slate-400 mb-2">Warum wolltest du dich in diese soziale Situation bringen? Mehrere Gründe sind möglich.</div>
              <div className="flex flex-wrap gap-2">
                {purposeOptions.map(([value, label]) => (
                  <button key={value} type="button" onClick={() => togglePurpose(value)} className={`px-3 py-1.5 rounded-lg text-[11px] border ${purposes.includes(value) ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{label}</button>
                ))}
              </div>
            </div>
            <textarea value={fearPrediction} onChange={(e) => setFearPrediction(e.target.value)} rows={2} placeholder="Konkrete Befürchtung vorher: Was dachtest du, könnte passieren?" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 resize-none outline-none focus:border-sky-500/50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/50 border border-slate-800 rounded-xl p-4">
            <Slider label="Soziale Angst vorher" value={socialAnxietyBefore} setValue={setSocialAnxietyBefore} low="keine" high="extrem" />
            <Slider label="Erwartete Ablehnung / Peinlichkeit" value={expectedRejectionBefore} setValue={setExpectedRejectionBefore} low="unwahrscheinlich" high="sehr sicher" />
            <Slider label="Impuls zu vermeiden" value={avoidanceUrgeBefore} setValue={setAvoidanceUrgeBefore} low="kein Vermeiden" high="starker Fluchtimpuls" />
            <Slider label="Druck, jemanden ansprechen zu müssen" value={pressureToApproachBefore} setValue={setPressureToApproachBefore} low="kein Druck" high="starker Zwang/Leistungsdruck" />
            <Slider label="Gefühl eigener Wahlfreiheit vorher" value={choiceFreedomBefore} setValue={setChoiceFreedomBefore} low="Angst/Druck entscheidet" high="ich entscheide frei" />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-100">2. Was ist tatsächlich passiert?</h2>
            <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={performed} onChange={(e) => setPerformed(e.target.checked)} className="accent-sky-500" /> Ich habe die Annäherung / Exposition tatsächlich durchgeführt.</label>
            {performed && (
              <>
                <input value={actionDescription} onChange={(e) => setActionDescription(e.target.value)} placeholder="Was hast du konkret gemacht?" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs text-slate-400">Anzahl angesprochener Personen<input type="number" min="0" max="100" value={peopleApproached} onChange={(e) => setPeopleApproached(Number(e.target.value))} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Tatsächliches Ergebnis<select value={actualOutcome} onChange={(e) => setActualOutcome(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"><option value="positive">positiv</option><option value="neutral">neutral</option><option value="negative">negativ</option><option value="mixed">gemischt</option></select></label>
                </div>
                <textarea value={safetyBehaviors} onChange={(e) => setSafetyBehaviors(e.target.value)} rows={2} placeholder="Sicherheitsverhalten? z. B. Gespräch schnell beendet, Blickkontakt vermieden, Sätze vorgeplant. Wenn keines: leer lassen." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 resize-none" />
                <textarea value={outcomeDetails} onChange={(e) => setOutcomeDetails(e.target.value)} rows={2} placeholder="Wie hat die Person / Situation tatsächlich reagiert?" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 resize-none" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                  <Slider label="Soziale Angst nachher" value={socialAnxietyAfter} setValue={setSocialAnxietyAfter} low="keine" high="extrem" />
                  <Slider label="Gefühl eigener Wahlfreiheit nachher" value={choiceFreedomAfter} setValue={setChoiceFreedomAfter} low="Angst/Druck entscheidet" high="ich entscheide frei" />
                </div>
              </>
            )}
            <textarea value={learning} onChange={(e) => setLearning(e.target.value)} rows={3} placeholder="Was lernst du daraus? Was war anders als vorhergesagt?" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 resize-none" />
          </div>

          <button disabled={saving} className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Protokoll speichern
          </button>
        </form>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Verlauf</div>
        {loading ? <div className="text-xs text-slate-500"><Loader2 className="inline w-4 h-4 animate-spin mr-2" />Lade...</div> : items.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-500">Noch keine Social-Exposure-Logs. Das ist kein täglicher Pflicht-Tracker; nur relevante soziale Annäherungssituationen dokumentieren.</div>
        ) : items.map((item) => (
          <div key={item.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex flex-wrap justify-between gap-2"><div className="font-semibold text-slate-200">{item.context || item.target_type}</div><div className="text-slate-500">{new Date(item.occurred_at).toLocaleString('de-DE')}</div></div>
            <div className="flex flex-wrap gap-2">{Array.isArray(item.purposes) && item.purposes.map((purpose) => <span key={purpose} className="px-2 py-1 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20">{purposeOptions.find(([key]) => key === purpose)?.[1] || purpose}</span>)}</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="bg-slate-950 p-2 rounded-lg"><div className="text-[10px] text-slate-500">Angst</div><div className="font-mono text-slate-200">{item.social_anxiety_before} → {item.social_anxiety_after ?? '?'}</div></div>
              <div className="bg-slate-950 p-2 rounded-lg"><div className="text-[10px] text-slate-500">Ablehnung erwartet</div><div className="font-mono text-slate-200">{item.expected_rejection_before}</div></div>
              <div className="bg-slate-950 p-2 rounded-lg"><div className="text-[10px] text-slate-500">Vermeidung</div><div className="font-mono text-slate-200">{item.avoidance_urge_before}</div></div>
              <div className="bg-slate-950 p-2 rounded-lg"><div className="text-[10px] text-slate-500">Ansprech-Druck</div><div className="font-mono text-slate-200">{item.pressure_to_approach_before}</div></div>
              <div className="bg-slate-950 p-2 rounded-lg"><div className="text-[10px] text-slate-500">Wahlfreiheit</div><div className="font-mono text-slate-200">{item.choice_freedom_before} → {item.choice_freedom_after ?? '?'}</div></div>
            </div>
            <div className="text-slate-400">Ergebnis: <span className="text-slate-200">{outcomeLabels[item.actual_outcome || ''] || item.actual_outcome || 'offen'}</span>{item.people_approached ? ` · ${item.people_approached} Person(en)` : ''}</div>
            {item.learning && <div className="bg-slate-950/60 rounded-lg p-3 text-slate-300"><strong>Learning:</strong> {item.learning}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
