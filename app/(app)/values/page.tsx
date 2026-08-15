'use client';

import { useEffect, useState } from 'react';
import { Compass, Plus, Save } from 'lucide-react';

type ValueEntry = {
  id: string;
  domain: string;
  title: string;
  importance: number;
  currentAlignment: number;
  behavioralDefinition: string | null;
};

const domains = ['Beziehungen', 'Familie', 'Freundschaft', 'Arbeit', 'Lernen', 'Gesundheit', 'Abenteuer', 'Kreativität', 'Beitrag', 'Freiheit', 'Stabilität', 'Sinn'];

export default function ValuesPage() {
  const [items, setItems] = useState<ValueEntry[]>([]);
  const [form, setForm] = useState({ domain: 'Beziehungen', title: '', importance: 7, currentAlignment: 5, behavioralDefinition: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/values');
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => { void load(); }, []);

  const addValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm((prev) => ({ ...prev, title: '', behavioralDefinition: '' }));
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (item: ValueEntry) => {
    await fetch('/api/values', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    await load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <div>
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" /> ACT Werte-Kompass
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Werte & Verhaltensausrichtung</h1>
        <p className="text-xs text-slate-400 mt-1">Werte beschreiben eine Richtung des Handelns. Ziele können erreicht werden; Werte werden fortlaufend gelebt.</p>
      </div>

      <form onSubmit={addValue} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Plus className="w-4 h-4 text-teal-400" /> Wert hinzufügen
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200">
            {domains.map((domain) => <option key={domain}>{domain}</option>)}
          </select>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="z. B. Verbundenheit, Lernen, Freiheit" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200" />
        </div>
        <textarea value={form.behavioralDefinition} onChange={(e) => setForm({ ...form, behavioralDefinition: e.target.value })} placeholder="Wie sieht dieser Wert konkret als beobachtbares Verhalten aus?" rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 resize-none" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <label className="space-y-2 text-slate-300">Wichtigkeit: <strong>{form.importance}/10</strong><input type="range" min="0" max="10" value={form.importance} onChange={(e) => setForm({ ...form, importance: Number(e.target.value) })} className="w-full accent-teal-400" /></label>
          <label className="space-y-2 text-slate-300">Aktuell gelebt: <strong>{form.currentAlignment}/10</strong><input type="range" min="0" max="10" value={form.currentAlignment} onChange={(e) => setForm({ ...form, currentAlignment: Number(e.target.value) })} className="w-full accent-teal-400" /></label>
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded-xl px-4 py-2 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Speichert...' : 'Speichern'}</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold">{item.domain}</div>
              <input value={item.title} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, title: e.target.value } : x))} className="mt-1 w-full bg-transparent text-base font-bold text-slate-100 outline-none border-b border-transparent focus:border-slate-700" />
            </div>
            <textarea value={item.behavioralDefinition || ''} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, behavioralDefinition: e.target.value } : x))} rows={3} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 resize-none" />
            <div className="space-y-3 text-xs">
              <label className="block text-slate-400">Wichtigkeit {item.importance}/10<input type="range" min="0" max="10" value={item.importance} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, importance: Number(e.target.value) } : x))} className="w-full accent-teal-400" /></label>
              <label className="block text-slate-400">Aktuell gelebt {item.currentAlignment}/10<input type="range" min="0" max="10" value={item.currentAlignment} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, currentAlignment: Number(e.target.value) } : x))} className="w-full accent-teal-400" /></label>
            </div>
            <button onClick={() => updateItem(item)} className="text-xs text-teal-400 hover:text-teal-300 font-medium">Änderungen speichern</button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
          Noch keine Werte erfasst. Das ist bewusst kein Pflichtschritt in Phase 1; die Values Map wird spätestens in Phase 4 systematisch aufgebaut.
        </div>
      )}
    </div>
  );
}
