import { client, ensureDatabaseReady } from '@/lib/db';
import { ensureSocialExposureStorage } from '@/lib/therapy/social-exposures';

const SESSION_ID = '00000000-0000-4000-8000-000000000817';
const SUMMARY_ID = '00000000-0000-4000-8000-000000000818';

/**
 * Persist the focused anamnesis/formulation work from 2026-08-17 that happened
 * in the surrounding ChatGPT conversation. This is intentionally structured as
 * therapeutic memory rather than a verbatim transcript.
 */
export async function ensureFocusedSessionMemory20260817(): Promise<void> {
  await ensureDatabaseReady();
  await ensureSocialExposureStorage();

  await client`
    INSERT INTO hypotheses (id, title, description, confidence, status, last_reviewed_at, created_at, updated_at)
    VALUES
      (
        'hyp-003',
        'Residualer Approach-/Mut-Leistungsdruck',
        'Arbeitshypothese: Die frühere soziale Vermeidung wurde durch umfangreiche selbstinitiierte Exposition stark reduziert. Residual kann nach ausgelassenen sozialen/romantischen Gelegenheiten eine selbstkritische Regel auftreten (z. B. „ich war zu feige“ / „ich hätte mein Training machen sollen“). Der Druck wurde mit etwa 6/10 beschrieben, klingt typischerweise innerhalb von ca. 10–30 Minuten ab und führt derzeit nicht zu anhaltendem Grübeln oder erkennbarer größerer Funktionsbeeinträchtigung. Zu beobachten ist daher Wahlfreiheit statt eine maximale Approach-Quote.',
        0.58,
        'active',
        NOW(), NOW(), NOW()
      ),
      (
        'hyp-004',
        'Beziehungs-Kompatibilität vs. Novelty/Habituation',
        'Arbeitshypothese: Der Rückgang von Erfüllung, Lebenszufriedenheit und romantisch-sexuellem Interesse in Beziehungen lässt sich nicht sinnvoll allein als Novelty-/Habituationseffekt erklären. Der Patient berichtet zusätzlich häufig fehlende emotionale und intellektuelle Tiefe sowie seit längerer Zeit fehlendes überzeugendes Gefühl gemeinsamer Zukunft bzw. „das ist meine Person“. Zu klären ist, ob diese Tiefe bereits früh begrenzt war und anfangs durch Neuheit/Verliebtheit überdeckt wurde oder ob zunächst echte Tiefe bestand und später selbst abnahm.',
        0.68,
        'active',
        NOW(), NOW(), NOW()
      )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      confidence = EXCLUDED.confidence,
      status = EXCLUDED.status,
      last_reviewed_at = NOW(),
      updated_at = NOW()
  `;

  const maintaining = [
    'Starke Bedeutung romantischer Partnerschaft für Einsamkeitsregulation, Sinn und Erfüllung; aktuelle Selbstwertabhängigkeit davon deutlich schwächer als früher.',
    'Offene Differenzierung zwischen realer emotional-intellektueller Inkompatibilität und Novelty-/Habituationseffekten in Beziehungen.',
    'Residualer Approach-/Mut-Leistungsdruck nach ausgelassenen Gelegenheiten; aktuell kurzlebig und ohne klaren größeren Funktionsverlust.',
  ];

  const protective = [
    'Historische soziale Bewertungsangst und Bedrohungsbereitschaft sind nach Selbstbericht stark gebessert; aktuell hohe soziale Handlungsfreiheit.',
    'Seit dem Leben in Thailand keine körperlichen Auseinandersetzungen berichtet.',
    'Etwa 250 selbstinitiierte soziale Annäherungen/Expositionen mit wiederholter Erfahrung, dass Ablehnung den Selbstwert nicht definiert und meist nichts Tragisches passiert.',
    'Hohe Ablehnungstoleranz und Bereitschaft zu realen Verhaltensexperimenten.',
    'Aktuelle Beziehungslosigkeit wird nur noch schwach als Beweis mangelnden eigenen Wertes interpretiert (ca. 2–3/10).',
  ];

  const triggering = [
    'Fehlende echte Beziehungs-/Zukunftsperspektive kann Einsamkeit deutlich erhöhen; reine Flirts reduzieren sie nur teilweise.',
    'Ausgelassene soziale/romantische Gelegenheit kann kurzfristig Selbstkritik („zu feige“) und Bedauern auslösen.',
    'In stabileren Beziehungen können wahrgenommene fehlende emotionale/intellektuelle Tiefe, abnehmende Aufregung und fehlendes Zukunftsgefühl Einsamkeit bzw. Suchdrang verstärken.',
  ];

  await client`
    INSERT INTO case_formulations (
      id, version, summary, predisposing_factors, triggering_factors,
      maintaining_factors, protective_factors, working_hypotheses_ids,
      reviewed_at, created_at
    )
    SELECT
      'form-v0.3',
      'v0.3',
      'Arbeitsmodell v0.3: Historisch bestanden neben depressiver Vulnerabilität deutliche soziale Bewertungsangst/soziale Hemmung sowie eine erhöhte Bedrohungs- und Verteidigungsbereitschaft in öffentlichen Situationen. Diese Muster sind nach Selbstbericht heute stark gebessert: freies Bewegen in öffentlichen Räumen, allein Bars/Clubs besuchen, Menschen ansprechen oder ignorieren; seit dem Leben in Thailand keine körperlichen Auseinandersetzungen. Als wahrscheinliche Veränderungsfaktoren werden die subjektiv sicherere Alltagserfahrung in Thailand, etwa 250 bewusst initiierte soziale Kontakte/Expositionen, Reifung, geringere depressive Belastung, verändertes Milieu und gestiegene Selbstsicherheit genannt. Residual besteht situativ Approach-/Mut-Leistungsdruck (ca. 6/10), wenn eine Gelegenheit nicht genutzt wird; die Selbstkritik klingt meist nach 10–30 Minuten ab. Beziehungsthema: In jüngeren Jahren waren Geliebtwerden/Partnerschaft gleichzeitig mit Einsamkeit, Selbstwert („nicht gut genug“) und Lebenssinn verknüpft. Heute ist die Selbstwertkopplung deutlich schwächer (ca. 2–3/10), während Partnerschaft, Liebe, Nähe und Sexualität weiterhin sehr hohe persönliche Bedeutung haben. Ohne irgendeinen romantisch-sexuellen Kontakt wird Einsamkeit retrospektiv mit etwa 10/10 eingeschätzt, bei Flirts ohne echte Beziehungsperspektive eher um 5/10. In guten Beziehungen sinkt Einsamkeit anfangs fast vollständig und Erfüllung, Lebenszufriedenheit sowie romantisch-sexuelles Interesse steigen; mit zunehmender Stabilität können Erfüllung, Lebenszufriedenheit und Begehren sinken, während Suche nach Alternativen zunimmt. Dies darf nicht vorschnell als reine Novelty/Habituation erklärt werden: häufig wurden fehlende emotionale und intellektuelle Tiefe sowie fehlendes überzeugendes gemeinsames Zukunftsgefühl berichtet. Offene Kernfrage ist, ob diese Tiefe bereits von Beginn an begrenzt und zunächst durch Neuheit überdeckt war oder ob zunächst echte Tiefe bestand und später abnahm.',
      COALESCE(base.predisposing_factors, '[]'::jsonb),
      COALESCE(base.triggering_factors, '[]'::jsonb) || ${JSON.stringify(triggering)}::jsonb,
      COALESCE(base.maintaining_factors, '[]'::jsonb) || ${JSON.stringify(maintaining)}::jsonb,
      COALESCE(base.protective_factors, '[]'::jsonb) || ${JSON.stringify(protective)}::jsonb,
      ${JSON.stringify(['hyp-001', 'hyp-002', 'hyp-003', 'hyp-004'])}::jsonb,
      NOW(), NOW()
    FROM (
      SELECT * FROM case_formulations
      ORDER BY created_at DESC
      LIMIT 1
    ) AS base
    ON CONFLICT (id) DO UPDATE SET
      summary = EXCLUDED.summary,
      predisposing_factors = EXCLUDED.predisposing_factors,
      triggering_factors = EXCLUDED.triggering_factors,
      maintaining_factors = EXCLUDED.maintaining_factors,
      protective_factors = EXCLUDED.protective_factors,
      working_hypotheses_ids = EXCLUDED.working_hypotheses_ids,
      reviewed_at = NOW()
  `;

  await client`
    INSERT INTO therapy_sessions (
      id, treatment_plan_id, treatment_phase_id, started_at, ended_at,
      session_type, main_topic, status, risk_level, created_at
    ) VALUES (
      ${SESSION_ID}::uuid,
      'plan-v0.1',
      'phase-1-reward',
      '2026-08-17T13:49:00+07:00'::timestamptz,
      '2026-08-17T13:49:00+07:00'::timestamptz,
      'focused_import',
      'Fokussierte Anamnese: soziale Angst, Selbstsicherheit, Beziehungserfüllung',
      'completed',
      0,
      '2026-08-17T13:49:00+07:00'::timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      treatment_plan_id = EXCLUDED.treatment_plan_id,
      treatment_phase_id = EXCLUDED.treatment_phase_id,
      main_topic = EXCLUDED.main_topic,
      status = EXCLUDED.status,
      risk_level = EXCLUDED.risk_level,
      ended_at = EXCLUDED.ended_at
  `;

  const keyObservations = [
    'Historisch waren soziale Bewertungsangst/soziale Hemmung und öffentliche Bedrohungsbereitschaft relevant, trotz grundsätzlich erhaltener sozialer Funktionsfähigkeit.',
    'Früher wurden öffentliche Situationen häufiger als potenziell eskalierend erlebt: mehr Adrenalin, Wachsamkeit, Verteidigungsbereitschaft und härtere nonverbale Signale. Heute ist diese automatische Eskalationserwartung deutlich geringer.',
    'Thailand wurde als subjektiv sichererer öffentlicher Raum erlebt und spielte neben Reifung, geringerem depressivem Niveau, verändertem Milieu und mehr Selbstsicherheit eine wichtige Rolle.',
    'Etwa 250 bewusst initiierte soziale Kontakte/Approaches dienten als selbst entwickeltes Expositions- und Selbstwirksamkeitstraining. Wiederholte Ablehnung wurde als normaler Teil des Alltags gelernt und nicht mehr als Definition des Selbstwerts erlebt.',
    'Aktuell hohe soziale Freiheit: Mall, Park, Bar oder Club allein sind möglich; seit dem Leben in Thailand keine körperlichen Auseinandersetzungen. Eine mögliche Wiederaktivierung alter Anspannung bei Rückkehr nach Deutschland bleibt als Beobachtungsfrage offen.',
    'Wenn eine gute Approach-Gelegenheit nicht genutzt wird, kann ein innerer Druck von etwa 6/10 mit Gedanken wie „zu feige“ oder „Training nicht gemacht“ entstehen. Die Selbstkritik hält meist nur ca. 10–30 Minuten an; kein anhaltendes Post-Event-Grübeln berichtet.',
    'In jüngeren Jahren bedeutete fehlende Partnerschaft gleichzeitig Einsamkeit, „mit mir stimmt etwas nicht / ich bin nicht gut genug“ und teilweise fehlenden Lebenssinn.',
    'Heute ist „keine Partnerin = nicht gut genug“ nur noch schwach (ca. 2–3/10). Dagegen bleiben Partnerschaft/Sinn/Vollständigkeit ca. 6–7/10 und Wunsch nach Liebe, Nähe und Sexualität ca. 8–9/10 relevant; die Vorstellung eines wirklich erfüllten Single-Lebens liegt eher bei ca. 3–4/10.',
    'Ohne irgendeinen romantisch-sexuellen Kontakt würde Einsamkeit nach Selbstbericht ungefähr 10/10 erreichen; mit Flirts ohne echte Beziehungsperspektive eher ungefähr 5/10.',
    'In guten Beziehungen verschwindet Einsamkeit anfangs fast vollständig. Mit Stabilität können Erfüllung, Lebenszufriedenheit und romantisch-sexuelles Interesse abnehmen; die Suche nach Alternativen steigt. Das Wissen/Erleben, geliebt zu werden, kann dabei trotzdem bestehen bleiben.',
    'Spätere Einsamkeit in Beziehungen wird nicht nur mit fehlender Aufregung/Verliebtheit erklärt. Häufig fehlten auch emotionale und intellektuelle Tiefe sowie ein überzeugendes Gefühl gemeinsamer Zukunft bzw. „das ist meine Person“.',
    'Sexuelle Spannung/Begehren könnten stärker novelty-abhängig sein; zugleich bleibt offen, ob bessere emotionale/intellektuelle Passung das Begehren stabilisieren würde.',
    'Wichtige Korrektur des Gesprächsprotokolls: Der Satz „Jetzt fehlt mir eigentlich gar nichts“ war ein Tipp-/Transkriptionsfehler und darf nicht als Selbstbericht gespeichert oder interpretiert werden.',
  ];

  const followUpTopics = [
    'Bei ein bis zwei konkreten früheren guten Beziehungen klären: War emotionale/intellektuelle Tiefe von Anfang an begrenzt und nur von Neuheit überdeckt, oder war sie anfangs real vorhanden und nahm später ab?',
    'Nach Rückkehr nach Deutschland nur bei realem Auftreten prüfen, ob Bedrohungsanspannung/Vermeidung wieder zunimmt; nicht prophylaktisch pathologisieren.',
    'Approach-Verhalten weiter über Wahlfreiheit beurteilen: frei hingehen vs. aus Angst vermeiden vs. aus Leistungsdruck hingehen.',
    'Dating-App-Motivchecks und Social-Exposure-Logs methodisch getrennt halten.',
    'Beziehungsbedeutung als Wert respektieren, gleichzeitig empirisch prüfen, welche Anteile von Einsamkeit, Erfüllung, Kompatibilität und Novelty unabhängig voneinander verlaufen.',
  ];

  await client`
    INSERT INTO session_summaries (
      id, session_id, main_issue, key_observations, intervention_used,
      key_insight, homework, follow_up_topics, created_at
    ) VALUES (
      ${SUMMARY_ID}::uuid,
      ${SESSION_ID}::uuid,
      'Soziale Angst, Selbstsicherheit & Beziehungserfüllung – fokussierte Anamnese',
      ${JSON.stringify(keyObservations)}::jsonb,
      'Retrospektive funktionale Analyse; Trennung von sozialer Exposition, Bedrohungsbereitschaft und Approach-Leistungsregel; zeitliche Trennung von früherer Selbstwertabhängigkeit und heutiger Beziehungsbedeutung; differenzielle Analyse von Beziehungsqualität vs. Novelty/Habituation.',
      'Die soziale Annäherung ist nach aktuellem Stand überwiegend ein erfolgreiches und adaptives Expositions-/Selbstwirksamkeitsverhalten; residualer Mut-Leistungsdruck ist vorhanden, aber kurzlebig. Die heutige Beziehungsproblematik scheint weniger durch „ich bin nicht gut genug“ als durch starke Bedeutung von Partnerschaft/Verbundenheit und eine noch offene Mischung aus realer emotional-intellektueller Kompatibilität, Zukunftsgefühl, Sexualität und Novelty/Habituation geprägt zu sein.',
      'Keine neue Approach-Quote und keine künstliche Gegenexposition festlegen. Daily Check-in, Dating-Motivchecks und relevante Social-Exposure-Logs fortsetzen. In der nächsten fokussierten Beziehungssitzung ein bis zwei konkrete gute Beziehungen zeitlich rekonstruieren: emotionale/intellektuelle Tiefe von Anfang an vs. späterer Verlust.',
      ${JSON.stringify(followUpTopics)}::jsonb,
      '2026-08-17T13:49:00+07:00'::timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      main_issue = EXCLUDED.main_issue,
      key_observations = EXCLUDED.key_observations,
      intervention_used = EXCLUDED.intervention_used,
      key_insight = EXCLUDED.key_insight,
      homework = EXCLUDED.homework,
      follow_up_topics = EXCLUDED.follow_up_topics
  `;
}
