import { BookOpen, Plus } from 'lucide-react';

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            Tagebuch & Notizen
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Gedanken & Reflexionen</h1>
          <p className="text-xs text-slate-400 mt-1">
            Einfaches Journal für Gedanken, Träume, Beziehungsnotizen und Therapie-Erkenntnisse.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all">
          <Plus className="w-4 h-4" />
          <span>Neuer Eintrag</span>
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <BookOpen className="w-10 h-10 text-purple-400/50 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">Noch keine Tagebucheinträge</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Nutze das Tagebuch für freie Gedanken ohne den Zwang zur sofortigen Analyse.
        </p>
      </div>
    </div>
  );
}
