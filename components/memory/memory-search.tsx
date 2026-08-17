'use client';

import { FormEvent, useState } from 'react';
import { Search, Loader2, Database, ShieldCheck, RefreshCw } from 'lucide-react';

type RetrievedMemory = {
  memoryKey: string;
  memoryType: string;
  title: string;
  content: string;
  domains: string[];
  importance: number;
  confidence: number;
  sourceLabel?: string | null;
  score?: number;
};

type SearchResult = {
  mode: 'hybrid' | 'lexical';
  core: RetrievedMemory[];
  relevant: RetrievedMemory[];
  corrections: Array<{
    correctionKey: string;
    incorrectClaim: string;
    correctedClaim: string;
    reason?: string | null;
  }>;
};

export function MemorySearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/memory?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Suche fehlgeschlagen');
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Suche fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Konsolidierung fehlgeschlagen');
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || 'Konsolidierung fehlgeschlagen');
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={search} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Alte Themen durchsuchen, z. B. emotionale Tiefe in Beziehungen …"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Suchen
          </button>
        </form>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-medium flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Verlauf konsolidieren
        </button>
      </div>

      {error && <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Retrieval: {result.mode === 'hybrid' ? 'semantisch + lexikalisch' : 'lexikalischer Fallback'}</span>
            <span>{result.relevant.length} thematisch relevante Treffer</span>
          </div>

          {result.corrections.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <ShieldCheck className="w-4 h-4" />
                Aktive Korrekturen mit Vorrang
              </div>
              {result.corrections.map((item) => (
                <div key={item.correctionKey} className="text-xs text-slate-300 leading-relaxed">
                  <span className="line-through text-slate-500">{item.incorrectClaim}</span>
                  <span className="mx-2 text-slate-600">→</span>
                  <span>{item.correctedClaim}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {result.relevant.map((memory) => (
              <div key={memory.memoryKey} className="rounded-xl border border-slate-800 bg-slate-950/55 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className="w-4 h-4 text-teal-400 shrink-0" />
                    <h3 className="text-xs font-semibold text-slate-100 truncate">{memory.title}</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{memory.memoryType}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{memory.content}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {memory.domains.map((domain) => (
                    <span key={domain} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500">{domain}</span>
                  ))}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/5 border border-teal-500/10 text-teal-500">
                    Relevanz {Math.round((memory.score || 0) * 100)}%
                  </span>
                </div>
                {memory.sourceLabel && <div className="text-[10px] text-slate-600">Quelle: {memory.sourceLabel}</div>}
              </div>
            ))}
          </div>

          {result.relevant.length === 0 && (
            <div className="text-xs text-slate-500 border border-slate-800 rounded-xl p-4">Keine ältere Erinnerung war für diese Suchanfrage ausreichend relevant.</div>
          )}
        </div>
      )}
    </div>
  );
}
