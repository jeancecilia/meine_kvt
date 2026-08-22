import { client, ensureDatabaseReady } from '@/lib/db';
import { ingestSessionSummaryMemory } from '@/lib/therapy/memory';

const SESSION_ID = '00000000-0000-4000-8000-000000000822';
const SUMMARY_ID = '00000000-0000-4000-8000-000000000823';
const IMPORTED_AT = '2026-08-22T09:26:00+07:00';

/**
 * Persist the focused relationship/reward-system work from the surrounding
 * ChatGPT conversation on 2026-08-22. This is a structured therapeutic import,
 * not a verbatim transcript. It is deliberately idempotent so opening either
 * therapy chat or the memory workspace can safely ensure it exists.
 */
export async function ensureFocusedSessionMemory20260822(): Promise<void> {
  await ensureDatabaseReady();

  await client`
    INSERT INTO hypotheses (id, title, description, confidence, status, last_reviewed_at, created_at, updated_at)
    VALUES
      (
        'hyp-004',
        'Beziehungs-Kompatibilität vs. Novelty/Habituation',
        'Aktualisierte Arbeitshypothese: Reale Inkompatibilität und Novelty-/Habituationseffekte können gleichzeitig wirken. Die sechs- bis siebenjährige erwachsene Langzeitbeziehung war nach retrospektivem Selbstbericht bereits in Weltbild, Normen und intellektueller Passung deutlich begrenzt; Attraktivität, Verliebtheit und sexuelle Anziehung trugen die Beziehung zunächst stark. Nach etwa ein bis zwei Jahren sank das partnerbezogene sexuelle Interesse deutlich, während der allgemeine sexuelle Antrieb erhalten blieb und sich auf andere Frauen richten konnte. Gleichzeitig gibt es bislang keinen erwachsenen Langzeit-Testfall mit hoher emotionaler, intellektueller, wertebezogener und ästhetisch-sexueller Passung. Deshalb darf aus früheren Beziehungen nicht geschlossen werden, dass Interesse bei jeder hoch passenden Partnerin zwangsläufig verschwinden würde.',
        0.84,
        'active',
        NOW(), NOW(), NOW()
      ),
      (
        'hyp-005',
        'Romantisch-sexueller Novelty-/Erreichbarkeitszyklus',
        'Arbeitshypothese mit inzwischen deutlicher Selbstbericht-Evidenz: Neuheit, offene Möglichkeiten, geringere Verfügbarkeit oder die Möglichkeit, eine Frau nicht zu bekommen bzw. zu verlieren, können sexuelles und zugleich breiteres persönliches/emotionales Interesse stark erhöhen. Wird die Person wieder verfügbar bzw. sexuell oder romantisch „erreicht“, kann nicht nur das sexuelle Begehren, sondern die gesamte Faszination an der Person relativ schnell wieder abfallen. Erneute Distanz oder Unverfügbarkeit kann das Interesse erneut anheben. Dies ist nicht als universelle Regel oder Diagnose zu behandeln, sondern als wiederholt berichtetes Muster, das in künftigen Beziehungen von tatsächlicher Kompatibilität getrennt geprüft werden muss.',
        0.88,
        'active',
        NOW(), NOW(), NOW()
      ),
      (
        'hyp-006',
        'Gebrauchtwerden als Abkürzung zu Beziehungssicherheit',
        'Arbeitshypothese: Das Gefühl, von einer Partnerin wirklich gebraucht zu werden, erzeugt zusätzliche Beziehungssicherheit, weil eine unabhängige Partnerin theoretisch jederzeit gehen könnte. Eine Trennung war besonders schmerzhaft in der Bedeutung „sie hat mich verlassen und lebt ohne mich weiter“ bzw. „sie braucht mich offenbar weniger als ich sie“. Gleichzeitig wird keine dauerhaft abhängige Partnerin als notwendiges Ideal beschrieben: Wenn eine eigenständige Partnerin über längere Zeit konsistent Loyalität, Liebe, Zukunftsplanung und freiwillige Wahl zeigt, würde sich nach eigener Einschätzung nach etwa zwei Jahren hohe Sicherheit entwickeln. Der Kern scheint daher eher stabile Evidenz für freiwilliges Bleiben als Abhängigkeit an sich zu sein.',
        0.70,
        'active',
        NOW(), NOW(), NOW()
      ),
      (
        'hyp-007',
        'Novelty-Spike und Handlungsrisiko in exklusiven Beziehungen',
        'Arbeitshypothese: Die zentrale Sorge ist weniger, andere Frauen attraktiv zu finden, sondern bei starker neuer Faszination nicht dauerhaft widerstehen zu können. Historisch führten starke Neugier/sexuelle Fantasie und reale Gelegenheit typischerweise nach Tagen bis wenigen Wochen mit Flirten, Schreiben, Fantasieren und Treffen-Planen zum Handeln; Konsequenzen der bestehenden Beziehung wurden dabei nach Selbstbericht kaum aktiv mitgedacht. Ein klarer „Point of no return“ kann rückblickend nicht benannt werden, und der Patient vermutet, bereits ab Initiation/starker Attraktion grundsätzlich zum Fremdgehen bereit gewesen zu sein. Bisher fehlt ein realer Gegenversuch: starke Faszination wahrnehmen, nicht weiterfüttern bzw. nicht handeln und beobachten, wie sie sich verändert. Daher ist „ich kann nicht widerstehen“ noch nicht als Fähigkeitstatsache belegt.',
        0.76,
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

  const triggering = [
    'Neue romantisch-sexuelle Person, offene Möglichkeit, geringere Verfügbarkeit oder das Gefühl, jemanden verlieren/nicht bekommen zu können, können Faszination und Begehren stark aktivieren.',
    'Zunehmende Vertrautheit und sichere Verfügbarkeit können in bisherigen romantisch-sexuellen Kontakten mit deutlichem Rückgang von sexueller und teilweise gesamter persönlicher Faszination einhergehen.',
    'Bei Trennung kann besonders die Bedeutung „sie hat mich verlassen und lebt ohne mich weiter / sie braucht mich nicht so wie ich sie“ schmerzhaft werden.',
  ];

  const maintaining = [
    'Starke Kopplung von romantisch-sexueller Faszination an Neuheit, offene Möglichkeiten, Distanz oder mögliche Nichterreichbarkeit; nach Erreichen kann der Reward stark abfallen.',
    'Hohe Glaubwürdigkeit der Beziehungsregel „Wenn sie wirklich die Richtige wäre, müsste ich sie auch nach zwei Jahren noch sehr stark begehren“ (ca. 8–9/10), obwohl rational ein verändertes langfristiges Begehren akzeptabel erscheint.',
    'Bisherige Erfahrung besteht überwiegend aus Novelty-Spike → Annäherung/Handeln → kurzfristiger Reward → erneuter Interessensabfall; die Lernerfahrung „starke Faszination haben und bewusst nicht handeln“ fehlt bislang.',
    'Historisch wurden bei neuen romantisch-sexuellen Möglichkeiten Konsequenzen für die bestehende Beziehung während Flirt-/Fantasie-/Annäherungsphasen wenig salient gemacht.',
    '„Vollständige Passung“ ist subjektiv sehr wichtig, aber noch nicht ausreichend operationalisiert; Gefahr einer beweglichen Ziellinie bleibt eine offene Prüffrage, keine Feststellung.',
  ];

  const protective = [
    'Langfristige Bindungsfähigkeit ist grundsätzlich vorhanden: ein bester Freund ist seit über 20 Jahren stabil sehr wichtig; bei engen männlichen Freundschaften wird kein vergleichbarer Novelty-bedingter Interessensabfall berichtet.',
    'Nähe an sich wird nicht als grundsätzlich aversiv beschrieben: Solange Faszination und eigenes Interesse vorhanden sind, kann romantische Nähe genossen werden, einschließlich des Gefühls „sie will mich“.',
    'Der Patient kann retrospektiv reale Inkompatibilität von Trennungsschmerz unterscheiden und bewertet die frühere lange Partnerschaft heute trotz damaliger Verletzung klar als nicht passend.',
    'Er hält es selbst für plausibel, sich bei hoher ästhetisch-sexueller, intellektueller, wertebezogener, emotionaler und lebenspraktischer Passung langfristig für eine Person entscheiden zu können.',
    'Er kann die zentrale Unsicherheit explizit benennen: Nicht die Existenz anderer Attraktion, sondern die Sorge, bei einem Novelty-Spike nicht zu widerstehen.',
  ];

  const formulationSummary = [
    'Arbeitsmodell v0.4 – Beziehung, Bindung und Reward: Die bisherige Langzeitbeziehungsgeschichte liefert keinen sauberen Test dafür, ob bei einer hoch passenden erwachsenen Partnerin langfristige Faszination erhalten bleiben kann. Die erste ernsthafte Beziehung mit 18/19 Jahren war durch damalige Instabilität und Jugendphase stark konfundiert. Die zweite ernsthafte Beziehung dauerte etwa sechs bis sieben Jahre und führte zu einer gemeinsamen Tochter; retrospektiv werden deutliche Unterschiede in Weltbild, Normen und intellektueller Passung berichtet. Attraktivität, Verliebtheit und sexuelle Anziehung trugen die Beziehung zunächst stark. Nach ungefähr ein bis zwei Jahren sank das partnerbezogene sexuelle Interesse deutlich, während der allgemeine sexuelle Antrieb erhalten blieb und sich auf andere Frauen richten konnte.',
    'Bei späteren Affären/romantisch-sexuellen Kontakten wurde ein wiederkehrenderes Muster beschrieben: Eine neue Person kann zunächst körperlich, emotional und als noch offene Möglichkeit sehr faszinierend sein. Wenn sie weniger verfügbar ist oder ein möglicher Verlust/Nichterreichen droht, kann Interesse erneut stark steigen. Nach Wiedererlangen, Sex oder zunehmender Verfügbarkeit kann nicht nur akute Lust, sondern die gesamte Faszination an der Person relativ schnell deutlich zurückgehen; erneute Distanz kann sie wieder anheben. Das stärkt die Novelty-/Erreichbarkeits-Hypothese über eine rein sexuelle Habituation hinaus.',
    'Gegen eine allgemeine Unfähigkeit zu langfristiger Bindung spricht eine seit über 20 Jahren stabile, wichtige beste Freundschaft sowie das Fehlen eines vergleichbaren Interessensabfalls in engen männlichen Freundschaften. Ein gleichwertiger platonischer Langzeitvergleich mit einer Frau fehlt. Romantische Nähe selbst scheint nicht per se aversiv: Solange Faszination vorhanden ist, wird Nähe genossen; wenn die eigene Faszination bereits abgefallen ist und die Partnerin weiterhin romantische Nähe sucht, entsteht eher Rückzugs-/Wegstoßimpuls.',
    'Trennungsschmerz der langen Beziehung war rückblickend nicht nur Einsamkeit. Besonders relevant war die Bedeutung „sie hat mich verlassen und lebt ohne mich weiter“, inklusive des Gefühls, sie brauche ihn offenbar weniger, als er sie. „Gebrauchtwerden“ scheint zusätzliche Sicherheit zu erzeugen. Gleichzeitig wird erwartet, dass eine eigenständige Partnerin nach längerer konsistenter freiwilliger Wahl, Loyalität und Zukunftsplanung ebenfalls hohe Sicherheit geben könnte; Abhängigkeit wird daher nicht als zwingendes Beziehungsideal angenommen.',
    'Eine zentrale aktuelle Beziehungsregel lautet mit subjektiver Überzeugung von etwa 8–9/10: „Wenn sie wirklich die Richtige wäre, müsste ich sie auch nach zwei Jahren noch sehr stark begehren.“ Rational wird gleichzeitig anerkannt, dass langfristiges Begehren anders aussehen kann. Die Kernbefürchtung ist: Selbst bei einer tatsächlich sehr passenden Partnerin könnte eine neue Frau stärker interessieren und der Patient könnte dieser Faszination nicht widerstehen. Historisch wurde bei starker Neugier/sexueller Fantasie und Gelegenheit meist gehandelt; häufig gingen Tage bis wenige Wochen mit Flirten, Schreiben, Fantasieren und Treffen-Planen voraus, ohne dass Konsequenzen stark mitgedacht wurden. Ein klarer später „Point of no return“ kann nicht benannt werden; subjektiv könnte Bereitschaft zum Fremdgehen bereits mit Initiation/starker Attraktion bestanden haben. Entscheidend: Es gibt bislang keinen realen Gegenversuch, in einer als wirklich passend erlebten exklusiven Beziehung einen starken Novelty-Spike bewusst nicht in Handlung umzusetzen.',
    'Daher bleiben zwei Fragen offen und müssen künftig empirisch getrennt werden: (1) Wie entwickelt sich Faszination/Begehren bei tatsächlich hoher langfristiger Passung? (2) Ist starkes neues Begehren ein zwingender Handlungsimpuls oder ein vorübergehender Reward-Zustand, der ohne Verstärkung/Handlung abklingen kann? Weniger Faszination allein ist bei diesem Muster kein ausreichender Beweis für mangelnde Passung.'
  ].join(' ');

  await client`
    INSERT INTO case_formulations (
      id, version, summary, predisposing_factors, triggering_factors,
      maintaining_factors, protective_factors, working_hypotheses_ids,
      reviewed_at, created_at
    )
    SELECT
      'form-v0.4',
      'v0.4',
      ${formulationSummary},
      COALESCE(base.predisposing_factors, '[]'::jsonb),
      COALESCE(base.triggering_factors, '[]'::jsonb) || ${JSON.stringify(triggering)}::jsonb,
      COALESCE(base.maintaining_factors, '[]'::jsonb) || ${JSON.stringify(maintaining)}::jsonb,
      COALESCE(base.protective_factors, '[]'::jsonb) || ${JSON.stringify(protective)}::jsonb,
      ${JSON.stringify(['hyp-001', 'hyp-002', 'hyp-003', 'hyp-004', 'hyp-005', 'hyp-006', 'hyp-007'])}::jsonb,
      ${IMPORTED_AT}::timestamptz,
      ${IMPORTED_AT}::timestamptz
    FROM case_formulations AS base
    WHERE base.id = 'form-v0.3'
    ON CONFLICT (id) DO UPDATE SET
      summary = EXCLUDED.summary,
      predisposing_factors = EXCLUDED.predisposing_factors,
      triggering_factors = EXCLUDED.triggering_factors,
      maintaining_factors = EXCLUDED.maintaining_factors,
      protective_factors = EXCLUDED.protective_factors,
      working_hypotheses_ids = EXCLUDED.working_hypotheses_ids,
      reviewed_at = EXCLUDED.reviewed_at
  `;

  await client`
    INSERT INTO therapy_sessions (
      id, treatment_plan_id, treatment_phase_id, started_at, ended_at,
      session_type, main_topic, status, risk_level, created_at
    ) VALUES (
      ${SESSION_ID}::uuid,
      'plan-v0.1',
      'phase-1-reward',
      ${IMPORTED_AT}::timestamptz,
      ${IMPORTED_AT}::timestamptz,
      'focused_import',
      'Beziehung, Novelty, Bindungssicherheit und Fremdgeh-Risikokette',
      'completed',
      0,
      ${IMPORTED_AT}::timestamptz
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
    'Erste ernsthafte Beziehung mit etwa 18/19 Jahren wird wegen damaliger Jugend/Instabilität nicht als geeigneter Langzeit-Testfall bewertet.',
    'Zweite ernsthafte Beziehung dauerte ungefähr sechs bis sieben Jahre; gemeinsame Tochter. Retrospektiv bestanden deutliche Unterschiede in Weltbild, Normen und intellektueller Passung. Attraktivität, Verliebtheit und sexuelle Anziehung waren anfangs starke tragende Faktoren.',
    'Partnerbezogenes sexuelles Interesse in der langen Beziehung sank nach ungefähr ein bis zwei Jahren deutlich. Der allgemeine sexuelle Antrieb blieb erhalten und richtete sich teilweise auf andere Frauen; es kam zu Fremdgehen.',
    'Bei Affären/anderen romantisch-sexuellen Kontakten wurde wiederholt beschrieben: neu = stark reizvoll; nach einigen Wochen bzw. zunehmender Verfügbarkeit sinkt nicht nur sexuelle Anziehung, sondern häufig auch emotionale/persönliche Faszination.',
    'Wenn eine Frau weniger verfügbar war, sich zurückzog oder möglicherweise verloren/nicht bekommen werden konnte, konnte das Interesse deutlich wieder ansteigen. Nach Wiedererlangen bzw. Sex fiel das globale Interesse häufig erneut schnell ab; gemeint ist ausdrücklich nicht nur der natürliche akute postorgasmische Lustabfall.',
    'Es gab bislang nach eigener Erinnerung keine Frau, bei der sexuelle/romantische Novelty deutlich nachließ, während ernsthaftes emotionales Interesse an ihr als Person langfristig stabil hoch blieb.',
    'Langfristige Bindungsfähigkeit ist grundsätzlich vorhanden: bester Freund seit über 20 Jahren sehr wichtig; bei engen männlichen Freundschaften kein vergleichbares Novelty-Muster. Keine gleichwertige enge platonische Frauenfreundschaft als Vergleich vorhanden.',
    'Romantische Nähe kann genossen werden, solange Faszination und eigenes Interesse vorhanden sind. Das Wegstoßen trat eher auf, wenn die eigene Faszination schon abgesunken war, während die Partnerin weiter aktiv romantische Nähe suchte.',
    'Trennung der langen Beziehung verletzte besonders in der Bedeutung „sie hat mich verlassen und lebt jetzt ohne mich weiter“. Hypothetisch wäre eine endgültige Trennung mit sichtbar gutem Weiterleben/neuem Partner schmerzhafter gewesen als eine Trennung, bei der sie ihn weiter sichtbar vermisst.',
    'Das Gefühl „dann braucht sie mich ja eigentlich gar nicht“ ist auch heute nachvollziehbar. Eine stärker abhängige Partnerin würde zunächst mehr Sicherheit geben. Eine eigenständige Partnerin, die über längere Zeit konsistent loyal bleibt und ihn freiwillig wählt, würde nach eigener Einschätzung nach etwa zwei Jahren jedoch ebenfalls hohe Sicherheit erzeugen.',
    'Bei hoher Passung hält der Patient es für möglich, sich langfristig für eine Person zu entscheiden. Genannt wurden insbesondere Ästhetik/sexuelle Anziehung, Intellekt, Humor, Zukunftspläne sowie implizit Werte/emotionale Passung; „vollständige Passung“ ist noch nicht konkret genug operationalisiert.',
    'Der Satz „Wenn sie wirklich die Richtige wäre, müsste ich sie auch nach zwei Jahren noch sehr stark begehren“ fühlt sich aktuell mit etwa 8–9/10 überzeugend an. Rational wird gleichzeitig gewünscht/erwartet, dass langfristiges Begehren anders aussehen darf.',
    'Kernbefürchtung: Bei einer tatsächlich passenden Partnerin könnte nach einiger Zeit eine andere Frau stärker interessieren und der Patient könnte der neuen Faszination nicht widerstehen. Die Sorge betrifft damit stärker Verhalten/Entscheidung als das bloße Auftreten fremder Attraktion.',
    'Historisch wurde bei starker neuer sexueller Neugier/Fantasie und Gelegenheit normalerweise irgendwann gehandelt; eine bewusste Entscheidung gegen eine stark begehrte reale Gelegenheit wird nicht erinnert.',
    'Vor Fremdgehen lagen typischerweise Tage bis wenige Wochen mit Flirten, Schreiben, Fantasieren und Treffen-Planen. Konsequenzen der bestehenden Beziehung wurden dabei nach Selbstbericht nicht aktiv mitgedacht. Ein klarer Point of no return kann nicht benannt werden; subjektiv hätte Bereitschaft zum Fremdgehen bereits ab Initiation/starker Attraktion bestehen können.',
    'Es gibt damit bisher keinen realen Gegenversuch, der beweist oder widerlegt, dass ein starker Novelty-Spike ohne weiteres romantisch-sexuelles Verstärken und ohne Handeln wieder abklingen kann.',
  ];

  const followUpTopics = [
    '„Vollständige Passung“ später operationalisieren: notwendige Mindestbedingungen von anfänglichem Kick/Novelty trennen; keine bewegliche Ziellinie unterstellen, sondern prüfen.',
    'Bei einer künftigen tatsächlich hoch passenden exklusiven Beziehung Begehren/Faszination longitudinal beobachten und einen Rückgang nicht automatisch als Beweis mangelnder Passung interpretieren.',
    'Falls künftig ein starker Novelty-Spike auf eine andere Person entsteht, Attraktion, Fantasie, Kontaktverstärkung, Konsequenzsalienz und tatsächliches Verhalten getrennt erfassen. Keine Annahme, dass Auftreten von Begehren = Handeln.',
    'Später eine konkrete Schutz-/Entscheidungsstrategie für exklusive Beziehungen entwickeln, die früh in der Annäherungskette ansetzt; aktuell kein künstliches Experiment ohne reale Beziehungssituation erzwingen.',
    'Weiter klären, ob „gebraucht werden“ primär frühe Sicherheit beschleunigt oder in stabilen Beziehungen selbst dauerhaft notwendig bleibt; aktuelle Evidenz spricht eher für die erste Variante.',
  ];

  const keyInsight = 'Die Beziehungsthematik lässt sich inzwischen nicht mehr sinnvoll auf „falsche Partnerin“ oder „reine sexuelle Langeweile“ reduzieren. Wiederholt zeigt sich ein breiter romantisch-sexueller Reward-Zyklus: Neuheit, offene Möglichkeit und Unverfügbarkeit erhöhen Faszination; Erreichen/Verfügbarkeit können sexuelle und persönliche Faszination stark senken. Gleichzeitig ist langfristige Bindungsfähigkeit außerhalb dieses Kontexts vorhanden, und es fehlt ein erwachsener Testfall mit wirklich hoher Partnerpassung. Die zentrale Zukunftsfrage ist daher nicht, ob andere Attraktion auftaucht, sondern ob ein Novelty-Spike Verhalten zwingend bestimmen muss oder bewusst überstanden werden kann.';

  const homework = 'Kein künstliches Fremdgeh-/Verzichtsexperiment ohne passende reale Situation. Für die nächste fokussierte Sitzung zunächst die langfristig nicht verhandelbaren Beziehungskriterien konkretisieren und zwischen Passung, Sicherheit, sexuellem Begehren und Novelty-Kick unterscheiden.';

  await client`
    INSERT INTO session_summaries (
      id, session_id, main_issue, key_observations, intervention_used,
      key_insight, homework, follow_up_topics, created_at
    ) VALUES (
      ${SUMMARY_ID}::uuid,
      ${SESSION_ID}::uuid,
      'Beziehung, Novelty, Bindungssicherheit und Fremdgeh-Risikokette',
      ${JSON.stringify(keyObservations)}::jsonb,
      'Retrospektive funktionale Analyse mehrerer Beziehungsepisoden; Trennung von allgemeiner Libido vs. partnerbezogenem Interesse; Prüfung von Neuheit, Verfügbarkeit, Verlustmöglichkeit und persönlicher Faszination; Vergleich romantischer Beziehungen mit langjähriger Freundschaft; Differenzierung von Gebrauchtwerden, freiwilliger Wahl, Attraktion und tatsächlichem Handeln.',
      ${keyInsight},
      ${homework},
      ${JSON.stringify(followUpTopics)}::jsonb,
      ${IMPORTED_AT}::timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      main_issue = EXCLUDED.main_issue,
      key_observations = EXCLUDED.key_observations,
      intervention_used = EXCLUDED.intervention_used,
      key_insight = EXCLUDED.key_insight,
      homework = EXCLUDED.homework,
      follow_up_topics = EXCLUDED.follow_up_topics
  `;

  await ingestSessionSummaryMemory({
    summaryId: SUMMARY_ID,
    sessionId: SESSION_ID,
    mainIssue: 'Beziehung, Novelty, Bindungssicherheit und Fremdgeh-Risikokette',
    keyObservations,
    interventionUsed: 'Retrospektive funktionale Beziehungs- und Reward-Analyse',
    keyInsight,
    homework,
    followUpTopics,
    occurredAt: IMPORTED_AT,
    memoryCandidates: [
      {
        type: 'semantic',
        title: 'Kein erwachsener Hoch-Passungs-Langzeittest vorhanden',
        content: 'Die bisherigen ernsthaften Beziehungen erlauben keine belastbare Aussage darüber, ob bei einer erwachsenen Partnerin mit hoher ästhetisch-sexueller, intellektueller, emotionaler und wertebezogener Passung die Faszination langfristig ähnlich stark abfallen würde. Die erste Beziehung war in der Jugend; die zweite hatte schon früh deutliche Passungsprobleme.',
        domains: ['beziehung', 'sinn-erfuellung'],
        importance: 0.92,
        confidence: 0.94,
      },
      {
        type: 'hypothesis',
        title: 'Breiter romantisch-sexueller Novelty-/Erreichbarkeitszyklus',
        content: 'Neuheit, offene Möglichkeiten und geringere Verfügbarkeit scheinen nicht nur sexuelles Begehren, sondern auch die gesamte Faszination an einer Frau zu erhöhen. Nach Erreichen/Verfügbarkeit kann diese globale Faszination rasch sinken; Distanz kann sie erneut erhöhen. Das Muster ist wiederholt berichtet, aber nicht als universelle Regel zu behandeln.',
        domains: ['beziehung', 'adhs-reward'],
        importance: 0.94,
        confidence: 0.88,
      },
      {
        type: 'semantic',
        title: 'Allgemeiner sexueller Antrieb blieb trotz partnerbezogenem Lustverlust erhalten',
        content: 'In der langen Beziehung sank das sexuelle Interesse an der Partnerin deutlich, während der allgemeine sexuelle Antrieb erhalten blieb und sich teilweise auf andere Frauen richtete. Ein globaler Libidoverlust erklärt diesen Verlauf daher nach aktuellem Selbstbericht nicht gut.',
        domains: ['beziehung', 'adhs-reward'],
        importance: 0.84,
        confidence: 0.94,
      },
      {
        type: 'semantic',
        title: 'Langfristige Bindungsfähigkeit außerhalb des romantischen Novelty-Kontexts vorhanden',
        content: 'Ein bester Freund ist seit über 20 Jahren sehr wichtig; bei engen männlichen Freundschaften wird kein vergleichbarer Novelty-bedingter Interessensabfall berichtet. Das spricht gegen eine allgemeine Unfähigkeit, Menschen nach Verlust der Neuheit langfristig wichtig zu finden.',
        domains: ['beziehung'],
        importance: 0.88,
        confidence: 0.96,
      },
      {
        type: 'hypothesis',
        title: 'Gebrauchtwerden beschleunigt Beziehungssicherheit',
        content: '„Gebraucht werden“ scheint zusätzliche frühe Sicherheit zu geben, weil eine unabhängige Partnerin theoretisch gehen könnte. Längerfristig könnte konsistente freiwillige Wahl/Loyalität dieselbe Sicherheitsfunktion übernehmen; eine abhängige Partnerin scheint daher nicht zwingend notwendig.',
        domains: ['beziehung'],
        importance: 0.80,
        confidence: 0.70,
      },
      {
        type: 'semantic',
        title: 'Trennungsschmerz: Sie hat mich verlassen und lebt ohne mich weiter',
        content: 'Beim Ende der langen Beziehung war besonders schmerzhaft, dass die Ex-Partnerin ihn verlassen hatte und ihr Leben ohne ihn weiterführen konnte. Nachfolgende liebevolle Partnerinnen konnten Einsamkeit/Nähe teilweise auffangen, beseitigten diese Verletzung aber nicht sofort.',
        domains: ['beziehung'],
        importance: 0.82,
        confidence: 0.92,
      },
      {
        type: 'hypothesis',
        title: 'Starkes neues Begehren ist noch nicht als zwingendes Verhalten getestet',
        content: 'Historisch wurde bei starker neuer Faszination und Gelegenheit meist gehandelt, häufig nach Flirten/Schreiben/Fantasieren. Es gibt aber bislang keinen bewussten Gegenversuch in einer hoch passenden exklusiven Beziehung, der zeigen würde, ob ein Novelty-Spike ohne Verstärkung und Handlung wieder abklingen kann. „Ich kann nicht widerstehen“ ist daher eine Befürchtung, keine bereits bewiesene Fähigkeitstatsache.',
        domains: ['beziehung', 'adhs-reward'],
        importance: 0.93,
        confidence: 0.86,
      },
      {
        type: 'semantic',
        title: 'Beziehungsregel: Die Richtige müsste langfristig stark begehrt werden',
        content: 'Der Gedanke „Wenn sie wirklich die Richtige wäre, müsste ich sie auch nach zwei Jahren noch sehr stark begehren“ fühlt sich aktuell ungefähr 8–9/10 überzeugend an. Rational wird gleichzeitig akzeptiert, dass langfristiges Begehren anders aussehen kann; diese Diskrepanz ist ein wichtiges künftiges KVT-Thema.',
        domains: ['beziehung', 'sinn-erfuellung'],
        importance: 0.90,
        confidence: 0.95,
      },
    ],
  });
}
