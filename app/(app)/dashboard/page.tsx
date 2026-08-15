import Link from 'next/link';
import { db } from '@/lib/db';
import { dailyCheckins, experiments, hypotheses } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import {
  Calendar,
  Activity,
  MessageSquare,
  AlertCircle,
  FlaskConical,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const revalidate = 0; // Dynamic server render

export default async function DashboardPage() {
  const latestCheckins = await db.select().from(dailyCheckins).orderBy(desc(dailyCheckins.date)).limit(1);
  const activeExperiments = await db.select().from(experiments).where(eq(experiments.status, 'active')).limit(1);
  const activeHypotheses = await db.select().from(hypotheses).where(eq(hypotheses.status, 'active')).limit(1);

  const checkin = latestCheckins[0];
  const activeExp = activeExperiments[0];
  const mainHypothesis = activeHypotheses[0];

  const currentDate = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            Therapeutic Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Guten Tag</h1>
          <p className="text-xs text-slate-400 mt-1 capitalize">{currentDate}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/check-in"
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-medium transition-all"
          >
            <Activity className="w-4 h-4 text-teal-400" />
            <span>30s Check-in</span>
          </Link>
          <Link
            href="/therapy"
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-lg shadow-teal-900/30"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Sitzung starten</span>
          </Link>
        </div>
      </div>

      {/* Current State Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Aktueller Zustand (Letzter Check-in)
          </h2>
          <Link href="/progress" className="text-xs text-teal-400 hover:underline flex items-center gap-1">
            Verlauf & Trends <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Stimmung', value: checkin?.mood ?? 5, max: 10, color: 'text-emerald-400' },
            { label: 'Erfüllung', value: checkin?.fulfillment ?? 5, max: 10, color: 'text-teal-400' },
            { label: 'Einsamkeit', value: checkin?.loneliness ?? 3, max: 10, color: 'text-amber-400' },
            { label: 'Freude', value: checkin?.joy ?? 5, max: 10, color: 'text-indigo-400' },
            { label: 'Grübeln', value: checkin?.rumination ?? 4, max: 10, color: 'text-rose-400' },
            { label: 'Neuheitsdrang', value: checkin?.noveltyDrive ?? 4, max: 10, color: 'text-purple-400' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-1 hover:border-slate-700 transition-all"
            >
              <div className="text-xs text-slate-400">{item.label}</div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</span>
                <span className="text-[10px] text-slate-500">/ 10</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Focus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Experiment Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <FlaskConical className="w-4 h-4" />
              Aktives Experiment
            </div>
            <span className="text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-medium">
              In Bearbeitung
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-slate-100 text-base">
              {activeExp ? activeExp.title : 'Habituation von wahrer Entfremdung unterscheiden'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {activeExp
                ? activeExp.prediction
                : 'Eine gewohnte Aktivität/Beziehung für 7 Tage ohne vorschnelles Ersetzen weiterführen und Interesse systematisch protokollieren.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Tag 4 von 7</span>
            </div>
            <Link
              href="/experiments"
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              Beobachtung eintragen <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Longitudinal AI Hypothesis Observation */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Longitudinale KI-Beobachtung
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-300 bg-teal-500/5 border border-teal-500/15 p-3.5 rounded-xl leading-relaxed italic">
              &ldquo;
              {mainHypothesis
                ? `${mainHypothesis.title}: ${mainHypothesis.description}`
                : 'Gedrückte Stimmung scheint diese Woche stärker mit Einsamkeit nach ruhigen Tagen als mit tatsächlicher Überforderung zu korrelieren.'}
              &rdquo;
            </div>
            <p className="text-[11px] text-slate-500">
              *HINWEIS: Wird als klinische Arbeitshypothese geführt, nicht als medizinische Diagnose.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span className="text-xs text-slate-400">Vertrauen: 82%</span>
            <Link href="/formulation" className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1">
              Fallformulierung prüfen <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Schnellaktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/situations"
            className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-200 group-hover:text-amber-300">Situation protokollieren</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Automatische KVT-Analyse</div>
            </div>
          </Link>

          <Link
            href="/therapy"
            className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-200 group-hover:text-indigo-300">Wochen-Sitzung</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Strukturierte KI-Sitzung</div>
            </div>
          </Link>

          <Link
            href="/journal"
            className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900/80 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-200 group-hover:text-purple-300">Tagebuch Notiz</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Gedanke / Freie Notiz</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
