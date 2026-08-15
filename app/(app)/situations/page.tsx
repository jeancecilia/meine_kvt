import { AlertCircle, Plus } from 'lucide-react';

export default function SituationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4" />
            Situation Protokollieren
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Situations- & Kognitionsanalyse</h1>
          <p className="text-xs text-slate-400 mt-1">
            Erfasse konkrete Situationen für eine strukturierte 5-Stufen KVT-Analyse.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all">
          <Plus className="w-4 h-4" />
          <span>Neue Situation</span>
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-400/50 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">Noch keine Situationen protokolliert</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Nutze die Situationsanalyse, wenn du starke Emotionen, Grübeln oder spontanen Impulsdrang bemerkst.
        </p>
      </div>
    </div>
  );
}
