import { TrendingUp } from 'lucide-react';

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <TrendingUp className="w-4 h-4" />
          Longitudinales Monitoring
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Fortschritt & Trends</h1>
        <p className="text-xs text-slate-400 mt-1">
          Verlaufskurven für Stimmung, Erfüllung, Einsamkeit, Grübeln und weitere Dimensionen.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <TrendingUp className="w-10 h-10 text-teal-400/50 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">Keine ausreichenden Daten für Diagramme</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Führe regelmäßige tägliche Check-ins durch, um langfristige Verläufe und Korrelationen zu visualisieren.
        </p>
      </div>
    </div>
  );
}
