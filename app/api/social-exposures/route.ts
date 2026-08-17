import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/db';
import { ensureSocialExposureStorage, getRecentSocialExposureLogs } from '@/lib/therapy/social-exposures';

export const revalidate = 0;

function rating(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(10, Math.round(parsed * 2) / 2));
}

export async function GET() {
  try {
    const items = await getRecentSocialExposureLogs(50);
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Social exposure GET error:', error);
    return NextResponse.json({ error: error?.message || 'Soziale Expositionen konnten nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSocialExposureStorage();
    const body = await req.json();

    const purposes = Array.isArray(body.purposes)
      ? body.purposes.filter((item: unknown) => typeof item === 'string').slice(0, 10)
      : [];

    const performed = body.performed !== false;
    const peopleApproached = performed
      ? Math.max(0, Math.min(100, Math.round(Number(body.peopleApproached) || 0)))
      : 0;

    const rows = await client`
      INSERT INTO social_exposure_logs (
        context, target_type, purposes, fear_prediction,
        social_anxiety_before, expected_rejection_before, avoidance_urge_before,
        pressure_to_approach_before, choice_freedom_before,
        performed, action_description, people_approached, safety_behaviors,
        social_anxiety_after, actual_outcome, outcome_details,
        choice_freedom_after, learning
      ) VALUES (
        ${body.context || null},
        ${body.targetType || 'other'},
        ${JSON.stringify(purposes)}::jsonb,
        ${body.fearPrediction || null},
        ${rating(body.socialAnxietyBefore)},
        ${rating(body.expectedRejectionBefore)},
        ${rating(body.avoidanceUrgeBefore)},
        ${rating(body.pressureToApproachBefore)},
        ${rating(body.choiceFreedomBefore)},
        ${performed},
        ${body.actionDescription || null},
        ${peopleApproached},
        ${body.safetyBehaviors || null},
        ${body.socialAnxietyAfter === null || body.socialAnxietyAfter === undefined ? null : rating(body.socialAnxietyAfter)},
        ${body.actualOutcome || null},
        ${body.outcomeDetails || null},
        ${body.choiceFreedomAfter === null || body.choiceFreedomAfter === undefined ? null : rating(body.choiceFreedomAfter)},
        ${body.learning || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ item: rows[0] });
  } catch (error: any) {
    console.error('Social exposure POST error:', error);
    return NextResponse.json({ error: error?.message || 'Soziale Exposition konnte nicht gespeichert werden' }, { status: 500 });
  }
}
