'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Sparkles,
  Send,
  Play,
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
  Loader2,
  FileCheck,
  RotateCcw,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SummaryResult {
  mainIssue: string;
  keyObservations: string[] | string;
  interventionUsed: string;
  keyInsight: string;
  homework: string;
}

function TherapySessionContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode');

  const [sessionType, setSessionType] = useState<string | null>(initialMode || null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async (type: string) => {
    setSessionType(type);
    setLoading(true);

    let initialPrompt = '';
    if (type === 'weekly') {
      initialPrompt = 'Ich starte unsere wöchentliche Struktursitzung. Wie steht es um meinen Wochenverlauf und Experiment 001?';
    } else if (type === 'focused') {
      initialPrompt = 'Ich möchte an einem fokussierten Thema arbeiten: der Diskrepanz zwischen Zielerreichung und emotionalem Nachhall.';
    } else {
      initialPrompt = 'Ich brauche eine kurze 5-Minuten-Klärung zu einem akuten Impuls.';
    }

    try {
      const res = await fetch('/api/therapy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: type,
          message: initialPrompt,
        }),
      });

      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([
        { role: 'user', content: initialPrompt },
        { role: 'assistant', content: data.reply },
      ]);
    } catch {
      alert('Fehler beim Starten der Sitzung');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/therapy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sessionType,
          message: userText,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Entschuldigung, es gab ein Verbindungsproblem. Bitte versuche es erneut.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSession = async () => {
    if (!sessionId) return;
    setSummarizing(true);

    try {
      const res = await fetch('/api/therapy/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      setSummary(data);
    } catch {
      alert('Zusammenfassung konnte nicht erstellt werden');
    } finally {
      setSummarizing(false);
    }
  };

  // If no session started yet, show format selection
  if (!sessionType) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            Strukturierter Dialog
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Therapiesitzung wählen</h1>
          <p className="text-xs text-slate-400 mt-1">
            Wähle das passende Format. Verhaltenstherapie wirkt am besten in einem strukturierten, zielgerichteten Rahmen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              type: 'weekly',
              title: 'Wöchentliche Struktursitzung',
              tag: '1× pro Woche (30-45 Min)',
              desc: 'Review der 10 Skalen, Auswertung von Experiment 001, KVT/PAT-Intervention und Festlegung des nächsten Experiments.',
              color: 'border-teal-500/30 bg-teal-500/5 hover:border-teal-500/60',
              btn: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500',
            },
            {
              type: 'focused',
              title: 'Fokussiertes Thema',
              tag: 'Bei Bedarf (15-20 Min)',
              desc: 'Gezielte Bearbeitung eines Schemas: z.B. Anhedonie, Masterabschluss-Reaktion oder Erwartungs-Erlebens-Diskrepanz.',
              color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60',
              btn: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500',
            },
            {
              type: 'quick',
              title: 'Kurzintervention / Impuls',
              tag: 'Akut (5-10 Min)',
              desc: 'Schnelle Kognitions- und Impulsklärung bei akuter Einsamkeit, Dating-Drang oder starkem Grübeln.',
              color: 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60',
              btn: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500',
            },
          ].map((session) => (
            <div key={session.type} className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${session.color}`}>
              <div className="space-y-2">
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-slate-900/80 px-2.5 py-1 rounded-md text-slate-300 border border-slate-800">
                  {session.tag}
                </span>
                <h3 className="font-bold text-slate-100 text-sm pt-1">{session.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{session.desc}</p>
              </div>

              <button
                onClick={() => startSession(session.type)}
                className={`w-full flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl text-xs transition-all shadow-lg ${session.btn}`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Sitzung starten</span>
              </button>
            </div>
          ))}
        </div>

        {/* Realistic Crisis Support Notice */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-400">
          <PhoneCall className="w-5 h-5 text-teal-400 shrink-0" />
          <span>
            <strong>Wichtiger Hinweis:</strong> Diese App ist ein strukturiertes Selbsthilfe-Werkzeug und ersetzt keine ärztliche Notfallbehandlung. In akuten Krisensituationen wende dich bitte an die Telefonseelsorge (0800 111 0 111 / 116 123) oder den ärztlichen Notdienst (112 / 116 117).
          </span>
        </div>
      </div>
    );
  }

  // Summary View when session completed
  if (summary) {
    const observations = Array.isArray(summary.keyObservations)
      ? summary.keyObservations
      : typeof summary.keyObservations === 'string'
      ? JSON.parse(summary.keyObservations || '[]')
      : [];

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <FileCheck className="w-4 h-4" />
            Sitzungszusammenfassung
          </div>
          <button
            onClick={() => {
              setSessionType(null);
              setSessionId(null);
              setMessages([]);
              setSummary(null);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Neue Sitzung</span>
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2.5 py-0.5 rounded-full">
              Ergebnisprotokoll
            </span>
            <h2 className="text-lg font-bold text-slate-100">{summary.mainIssue}</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-semibold text-teal-400">Verwendete Intervention</div>
              <div className="text-slate-300">{summary.interventionUsed}</div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-semibold text-emerald-400">Zentrale Erkenntnis</div>
              <div className="text-slate-300 leading-relaxed">{summary.keyInsight}</div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-semibold text-purple-400">Vereinbartes Verhaltensexperiment / Aufgabe</div>
              <div className="text-slate-300 leading-relaxed">{summary.homework}</div>
            </div>
          </div>

          {observations.length > 0 && (
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-300">Wichtigste Beobachtungen:</div>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                {observations.map((obs: string, idx: number) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>In Sitzungshistorie gespeichert</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Chat View
  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSessionType(null)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>
                {sessionType === 'weekly'
                  ? 'Wöchentliche KVT-Struktursitzung'
                  : sessionType === 'focused'
                  ? 'Fokussierte Themenanalyse'
                  : 'Akute Kurzintervention'}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            </h2>
            <p className="text-[11px] text-slate-400">KVT / ACT / Positive Affect Treatment</p>
          </div>
        </div>

        <button
          onClick={handleFinishSession}
          disabled={summarizing || messages.length < 2}
          className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-200 text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all disabled:opacity-40"
        >
          {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" /> : <FileCheck className="w-3.5 h-3.5 text-teal-400" />}
          <span>Sitzung abschließen</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-950/30'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 whitespace-pre-line shadow-md'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-400 uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Meine KVT Begleiter</span>
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              <span>Analysiere im therapeutischen Kontext...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Antworte hier auf die Frage oder schildere deinen Gedanken..."
          disabled={loading || summarizing}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-all shadow-lg shadow-teal-900/30 disabled:opacity-50 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default function TherapyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
        <span>Lade Therapiesitzung...</span>
      </div>
    }>
      <TherapySessionContent />
    </Suspense>
  );
}
