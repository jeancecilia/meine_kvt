import { Compass } from 'lucide-react';

export default function ValuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          ACT Werte-Kompass
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Werte & Verhaltensausrichtung</h1>
        <p className="text-xs text-slate-400 mt-1">
          Werte sind Handlungsrichtungen (keine Ziele), die deinen Handlungen Sinn und Qualität verleihen.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <Compass className="w-10 h-10 text-teal-400/50 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">Wertebereiche definieren</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Bewerte Wichtigkeit und aktuelle Ausrichtung in Domänen wie Beziehungen, Arbeit, Gesundheit, Abenteuer und Kreativität.
        </p>
      </div>
    </div>
  );
}
