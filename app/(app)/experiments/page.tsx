import { FlaskConical, Plus } from 'lucide-react';

export default function ExperimentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            Verhaltensexperimente
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Aktive & Vergangene Experimente</h1>
          <p className="text-xs text-slate-400 mt-1">
            Prüfe Annahmen durch gezielte verhaltenstherapeutische Experimente im Alltag.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all">
          <Plus className="w-4 h-4" />
          <span>Neues Experiment</span>
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <FlaskConical className="w-10 h-10 text-purple-400/50 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">Keine aktiven Experimente</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Experimente entstehen meist aus deinen wöchentlichen Therapie-Sitzungen zur Überprüfung von Hypothesen.
        </p>
      </div>
    </div>
  );
}
