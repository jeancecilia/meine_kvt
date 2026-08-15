import { Settings, Database, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          System
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Einstellungen</h1>
        <p className="text-xs text-slate-400 mt-1">
          Single-Tenant Konfiguration, Daten-Export und Backups.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 text-slate-200 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-teal-400" />
          <h3 className="font-semibold text-sm">Datenbank & Datensicherung</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="font-medium text-xs text-slate-200">Manueller Datenexport</div>
            <div className="text-[11px] text-slate-400">Exportiere alle Check-ins, Sitzungen und Tagebucheinträge als JSON</div>
          </div>
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-xl transition-all">
            JSON Export herunterladen
          </button>
        </div>
      </div>
    </div>
  );
}
