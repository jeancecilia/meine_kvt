import Link from 'next/link';
import { db } from '@/lib/db';
import { treatmentPlans, treatmentPhases, treatmentModules, treatmentPlanReviews } from '@/lib/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { Target, CheckCircle2, Clock, Sparkles, FlaskConical, MessageSquare, FileText } from 'lucide-react';

export const revalidate = 0;

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

const statusClass: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  active: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
  planned: 'bg-slate-800/70 text-slate-400 border-slate-700',
  paused: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

export default async function TreatmentPlanPage() {
  const plans = await db.select().from(treatmentPlans).orderBy(desc(treatmentPlans.createdAt)).catch(() => []);
  const plan = plans.find((item) => item.status === 'active') || plans[0] || null;

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-slate-100">Therapieplan</h1>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          Noch kein Therapieplan in der Datenbank. Beim nächsten erfolgreichen Datenbank-Bootstrap wird Plan v0.1 angelegt.
        </div>
      </div>
    );
  }

  const phases = await db
    .select()
    .from(treatmentPhases)
    .where(eq(treatmentPhases.treatmentPlanId, plan.id))
    .orderBy(asc(treatmentPhases.phaseNumber))
    .catch(() => []);

  const modules = await db.select().from(treatmentModules).orderBy(asc(treatmentModules.orderIndex)).catch(() => []);
  const phaseIds = new Set(phases.map((phase) => phase.id));
  const planModules = modules.filter((module) => phaseIds.has(module.phaseId));

  const reviews = await db
    .select()
    .from(treatmentPlanReviews)
    .where(eq(treatmentPlanReviews.treatmentPlanId, plan.id))
    .orderBy(desc(treatmentPlanReviews.reviewedAt))
    .catch(() => []);

  const activePhase = phases.find((phase) => phase.status === 'active') || null;
  const activeModules = activePhase ? planModules.filter((module) => module.phaseId === activePhase.id) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="border-b border-slate-800/80 pb-5 space-y-2">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
          <Target className="w-4 h-4" />
          Master-Therapieplan
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{plan.title}</h1>
            <p className="text-xs text-slate-400 mt-1">Version {plan.version} · {plan.startedAt} bis {plan.plannedEndAt || 'offen'}</p>
          </div>
          <span className="self-start md:self-auto text-xs px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-300 font-medium">
            {plan.status === 'active' ? 'Aktiver Plan' : plan.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gesamtziel</div>
          <p className="text-sm text-slate-200 leading-relaxed">{plan.overallGoal}</p>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nächster Plan-Review</div>
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <Clock className="w-4 h-4 text-teal-400" />
            {plan.reviewDueAt || 'Noch nicht geplant'}
          </div>
          <p className="text-[11px] text-slate-500">Änderungen am therapeutischen Schwerpunkt sollen über einen Review dokumentiert werden, nicht stillschweigend.</p>
        </div>
      </div>

      {activePhase && (
        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 to-slate-900/70 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-1">Aktuelle Phase</div>
              <h2 className="text-xl font-bold text-slate-100">Phase {activePhase.phaseNumber} – {activePhase.title}</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">{activePhase.objective}</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full border bg-teal-500/10 text-teal-300 border-teal-500/20">aktiv</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Erfolgskriterien</div>
              <ul className="space-y-2 text-xs text-slate-300">
                {asStringArray(activePhase.successCriteria).map((item) => (
                  <li key={item} className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Aktuelle Module</div>
              <div className="space-y-2">
                {activeModules.map((module) => (
                  <div key={module.id} className="text-xs border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                    <div className="font-semibold text-slate-200">{module.title}</div>
                    <div className="text-slate-500 mt-0.5">{module.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/therapy?mode=weekly" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 px-4 py-2 text-xs font-medium text-white transition-colors">
              <MessageSquare className="w-4 h-4" /> Wochensitzung
            </Link>
            <Link href="/experiments" className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-medium text-slate-200 transition-colors">
              <FlaskConical className="w-4 h-4 text-purple-400" /> Experiment ansehen
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">12-Wochen-Verlauf</h2>
        </div>

        <div className="space-y-3">
          {phases.map((phase) => {
            const phaseModules = planModules.filter((module) => module.phaseId === phase.id);
            const classes = statusClass[phase.status] || statusClass.planned;
            return (
              <div key={phase.id} className={`rounded-2xl border p-5 ${phase.status === 'active' ? 'border-teal-500/30 bg-slate-900/80' : 'border-slate-800 bg-slate-900/50'}`}>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="shrink-0 h-9 w-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                    {phase.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : phase.phaseNumber}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-100">Phase {phase.phaseNumber}: {phase.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{phase.description}</p>
                      </div>
                      <span className={`self-start text-[11px] px-2.5 py-0.5 rounded-full border ${classes}`}>{phase.status}</span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950/40 border border-slate-800/70 rounded-xl p-3">
                      <strong className="text-slate-400">Ziel:</strong> {phase.objective}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {phaseModules.map((module) => (
                        <div key={module.id} className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">{module.title}</span>
                            <span className="text-[10px] uppercase text-slate-500">{module.type}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{module.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Sparkles className="w-4 h-4 text-teal-400" /> Planhistorie
        </div>
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500">Noch kein formaler Plan-Review. Der erste Review ist nach ausreichend Daten aus Phase 1 vorgesehen.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="border-t border-slate-800 pt-3 first:border-0 first:pt-0">
                <div className="text-xs text-slate-200">{review.progressSummary}</div>
                <div className="text-[11px] text-slate-500 mt-1">{new Date(review.reviewedAt).toLocaleDateString('de-DE')} · nächster Review {review.nextReviewAt || 'offen'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
