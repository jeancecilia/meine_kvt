import Link from 'next/link';
import { db } from '@/lib/db';
import { dailyCheckins, experiments, hypotheses, therapyGoals } from '@/lib/db/schema';
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
  CheckCircle2,
  HeartHandshake,
  Compass,
} from 'lucide-react';

export const revalidate = 0;

export default async function DashboardPage() {
  const latestCheckins = await db.select().from(dailyCheckins).orderBy(desc(dailyCheckins.date)).limit(1).catch(() => []);
  const activeExperiments = await db.select().from(experiments).where(eq(experiments.status, 'active')).limit(1).catch(() => []);
  const activeHypotheses = await db.select().from(hypotheses).where(eq(hypotheses.status, 'active')).limit(1).catch(() => []);
  const activeGoals = await db.select().from(therapyGoals).where(eq(therapyGoals.status, 'active')).limit(3).catch(() => []);

  const checkin = latestCheckins[0] || null;
  const activeExp = activeExperiments[0] || null;
  const mainHypothesis = activeHypotheses[0] || null;

  const currentDate = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isTodayCheckin = checkin?.date === new Date().toISOString().split('T')[0];
  const isSaturday = new Date().getDay() === 6;

  // Calculate experiment day count
  let experimentDayText = 'Tag 1 von 7';
  if (activeExp?.startDate) {
    const diffDays = Math.max(1, Math.min(7, Math.floor((Date.now() - new Date(activeExp.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1));
    experimentDayText = `Tag ${diffDays} von 7`;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            Therapeutischer Arbeitsraum
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Guten Tag</h1>
          <p className="text-xs text-slate-400 mt-1 capitalize">{currentDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/experiments"
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-400/50 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>⚡ 10s Motivcheck</span>
          </Link>
          <Link
            href="/check-in"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              isTodayCheckin
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-200 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-teal-400" />
            <span>{isTodayCheckin ? 'Check-in erledigt' : '30s Check-in'}</span>
            {isTodayCheckin && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </Link>
          <Link
            href="/therapy?mode=quick"
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-medium transition-all"
          >
            <MessageSquare className="w-4 h-4 text-teal-400" />
            <span>Mit KI sprechen</span>
          </Link>
        </div>
      </div>

      {/* Primary Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Daily Check-in Card */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                Heute
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                isTodayCheckin ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}>
                {isTodayCheckin ? 'Erfasst' : 'Ausstehend'}
              </span>
            </div>
            <h3 className="font-bold text-slate-100 text-base">30s Check-in</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              10 Dimensionen kurz bewerten zur Erfassung der Affekt- und Einsamkeitsentwicklung.
            </p>
          </div>
          <Link
            href="/check-in"
            className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-xs font-medium py-2 rounded-xl text-center transition-all block"
          >
            {isTodayCheckin ? 'Werte ansehen / anpassen' : 'Jetzt bewerten (30 Sek.)'}
          </Link>
        </div>

        {/* 2. Active Experiment Card */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4" />
                Phase 1 Experiment
              </span>
              <span className="text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-medium">
                {experimentDayText}
              </span>
            </div>
            <h3 className="font-bold text-slate-100 text-base">
              {activeExp ? activeExp.title : 'Motive Decomposition'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeExp?.prediction || '10s Motivcheck: Bei Einsamkeit vor Tinder soziale Verbindung herstellen & Vorher/Nachher messen.'}
            </p>
          </div>
          <Link
            href="/experiments"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium py-2 rounded-xl text-center transition-all block shadow-lg shadow-purple-900/20"
          >
            Experiment & 10s-Motivcheck
          </Link>
        </div>

        {/* 3. Quick Situational Capture */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Etwas passiert?
              </span>
              <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
                KVT 5-Schritte
              </span>
            </div>
            <h3 className="font-bold text-slate-100 text-base">Situation festhalten</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Akuten Auslöser, automatische Gedanken und Handlungsreaktionen strukturiert protokollieren.
            </p>
          </div>
          <Link
            href="/situations"
            className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-xs font-medium py-2 rounded-xl text-center transition-all block"
          >
            Situation protokollieren
          </Link>
        </div>
      </div>

      {/* Weekly Structure Session Callout (Prominent on Saturdays) */}
      <div className={`border rounded-2xl p-5 space-y-3 ${
        isSaturday
          ? 'bg-gradient-to-r from-teal-950/60 to-slate-900/80 border-teal-500/40 shadow-xl'
          : 'bg-slate-900/40 border-slate-800/70'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">1× Wöchentlich</span>
              {isSaturday && (
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-md font-bold">
                  Heute fällig (Samstag)
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-100 text-base">Wöchentliche KVT/ACT-Struktursitzung</h3>
            <p className="text-xs text-slate-400">
              Umfassender Review der Woche, Auswertung von Experiment 001 und Planung des nächsten Interventionsschritts.
            </p>
          </div>
          <Link
            href="/therapy?mode=weekly"
            className="shrink-0 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition-all shadow-lg shadow-teal-900/20 text-center"
          >
            Wochensitzung starten
          </Link>
        </div>
      </div>

      {/* Current State Ratings (10 Dimensions) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Aktueller Zustand (T0 / Letzter Check-in)
          </h2>
          <Link href="/progress" className="text-xs text-teal-400 hover:underline flex items-center gap-1">
            Verlauf & Trends <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Stimmung', value: checkin?.mood ?? 5.5, color: 'text-emerald-400' },
            { label: 'Erfüllung', value: checkin?.fulfillment ?? 4.0, color: 'text-teal-400' },
            { label: 'Einsamkeit', value: checkin?.loneliness ?? 7.0, color: 'text-amber-400' },
            { label: 'Innere Ruhe', value: checkin?.innerCalm ?? 5.0, color: 'text-sky-400' },
            { label: 'Freude', value: checkin?.joy ?? 4.0, color: 'text-indigo-400' },
            { label: 'Grübeln', value: checkin?.rumination ?? 6.5, color: 'text-rose-400' },
            { label: 'Zukunftsangst', value: checkin?.futureAnxiety ?? 6.0, color: 'text-orange-400' },
            { label: 'Neuheitsdrang', value: checkin?.noveltyDrive ?? 7.0, color: 'text-purple-400' },
            { label: 'Energie', value: checkin?.energy ?? 6.0, color: 'text-yellow-400' },
            { label: 'Lebenszufriedenheit', value: checkin?.lifeSatisfaction ?? 5.0, color: 'text-teal-300' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-1 hover:border-slate-700 transition-all"
            >
              <div className="text-xs text-slate-400 truncate">{item.label}</div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</span>
                <span className="text-[10px] text-slate-500">/ 10</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Therapy Goals Summary */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4" />
            Therapieziele v0.1
          </span>
          <Link href="/formulation" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            Fallformulierung öffnen <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeGoals.map((g, idx) => (
            <div key={g.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-1 text-xs">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span>{g.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{g.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
