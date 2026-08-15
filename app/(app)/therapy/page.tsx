import { MessageSquare, Sparkles, ShieldCheck, Play } from 'lucide-react';

export default function TherapyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <MessageSquare className="w-4 h-4" />
          KI-Therapiebegleiter
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Strukturierte Therapiesitzung</h1>
        <p className="text-xs text-slate-400 mt-1">
          Wähle das Format für deine heutige Sitzung. Alle Sitzungen folgen einer KVT/ACT-basierten Struktur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Wöchentliche Struktursitzung',
            tag: 'Standard (45 Min)',
            desc: 'Sicherheits-Check, Rückblick auf Wochenverlauf, Experiment-Auswertung, Hauptthema & neues Verhaltensexperiment.',
            color: 'border-teal-500/30 bg-teal-500/5 hover:border-teal-500/60',
            buttonColor: 'bg-teal-600 hover:bg-teal-500',
          },
          {
            title: 'Fokussiertes Thema',
            tag: 'Gezielt (20 Min)',
            desc: 'Arbeite an einem spezifischen Anliegen: z.B. Beziehungsentscheidung, Arbeitsstress, Einsamkeit oder Sinnfrage.',
            color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60',
            buttonColor: 'bg-indigo-600 hover:bg-indigo-500',
          },
          {
            title: 'Kurzintervention',
            tag: 'Akut (10 Min)',
            desc: 'Schneller Impuls bei starkem Grübeln, akuter Unruhe oder akuter Vermeidungstendenz.',
            color: 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60',
            buttonColor: 'bg-purple-600 hover:bg-purple-500',
          },
        ].map((session) => (
          <div key={session.title} className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${session.color}`}>
            <div className="space-y-2">
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-slate-900/80 px-2.5 py-1 rounded-md text-slate-300 border border-slate-800">
                {session.tag}
              </span>
              <h3 className="font-semibold text-slate-100 text-sm pt-1">{session.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{session.desc}</p>
            </div>

            <button className={`w-full flex items-center justify-center gap-2 text-white font-medium py-2 rounded-xl text-xs transition-all ${session.buttonColor}`}>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Sitzung starten</span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
        <span>
          Sicherheits-Protokoll: Bei Anzeichen akuter Eigengefährdung schaltet das System automatisch in den Notfall-Modus mit direkten Hilfskontakten.
        </span>
      </div>
    </div>
  );
}
