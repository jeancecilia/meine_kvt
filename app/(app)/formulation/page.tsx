import { FileText, Sparkles } from 'lucide-react';

export default function FormulationPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" />
          Klinisches Verwendungsmodell
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Fallformulierung & Hypothesen</h1>
        <p className="text-xs text-slate-400 mt-1">
          Dynamisches Modell zur Erfassung prädisponierender, auslösender und aufrechterhaltender Faktoren.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-semibold text-sm text-slate-200">Aktuelles Modell (v0.1)</h3>
          <span className="text-[11px] bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-medium">
            Bestätigt durch Nutzer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-semibold text-teal-400">Historische / Biografie-Faktoren</h4>
            <p className="text-slate-400">Frühere depressive Phasen, ADHD-Diagnose, Belohnungsregulation.</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-400">Aufrechterhaltende Faktoren</h4>
            <p className="text-slate-400">Neuheitssuche, Interpretation von Habituation als Bedeutungsverlust, Grübeln.</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-semibold text-emerald-400">Schutzfaktoren</h4>
            <p className="text-slate-400">Sport/Bewegung, soziale Kontakte, Reflexionsfähigkeit, Zielorientierung.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
