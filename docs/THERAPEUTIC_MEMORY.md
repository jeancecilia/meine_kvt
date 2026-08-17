# Therapeutic Memory – Langzeitgedächtnis

## Ziel

`meine_kvt` soll nach Monaten oder Jahren nicht nur Daten besitzen, sondern den therapeutischen Verlauf wieder aufnehmen können: Was wurde berichtet? Was war nur Hypothese? Was wurde später korrigiert? Welche Muster haben sich verändert? Welche Fragen blieben offen?

Das Langzeitgedächtnis ersetzt **nicht** die Rohdaten. Es liegt als Retrieval-/Konsolidierungsschicht über den bestehenden Tabellen.

## Ebenen

### 1. Raw History

Unverändert in den bestehenden Tabellen:

- `therapy_sessions`
- `therapy_messages`
- `session_summaries`
- `daily_checkins`
- `situations`
- `experiments` / `experiment_observations`
- `motive_checks`
- `social_exposure_logs`
- Assessments, Journal, Values etc.

Diese Daten sind die primäre Quelle. Therapeutic Memory darf sie verdichten, aber nicht stillschweigend ersetzen.

### 2. Episodisches Gedächtnis

Tabelle `therapeutic_memories`, `memory_type = episodic`.

Jede abgeschlossene Sitzung wird automatisch als dauerhaftes Episoden-Memory gespeichert. Bereits vorhandene `session_summaries` werden beim ersten Start idempotent rückwirkend importiert.

### 3. Semantisches Gedächtnis

Beim Abschluss einer Sitzung darf die Zusammenfassungs-KI maximal wenige langfristig relevante Memory-Kandidaten extrahieren. Regeln:

- nur explizit durch Patientenaussage oder strukturierte Daten gestützte Information;
- keine Assistenteninterpretation als biografische Tatsache;
- Hypothesen bleiben als `hypothesis` markiert;
- Importance und Confidence werden getrennt gespeichert;
- jeder Eintrag hat Quelle/Source-Excerpt.

### 4. Versionierte Formulierungen und Hypothesen

Alle `case_formulations` und `hypotheses` werden in den Retrieval-Index übernommen. Ältere Fallformulierungen bleiben historisch erhalten, werden aber als `superseded` markiert; die aktuelle Version bleibt aktiv.

### 5. Korrekturen

`memory_corrections` enthält explizite Korrekturen früherer Aussagen, Transkriptionsfehler oder Fehlinterpretationen.

Regel: **Korrekturen haben im Prompt Vorrang vor allen älteren Memories.**

Der am 17.08.2026 korrigierte Satz „Jetzt fehlt mir eigentlich gar nichts“ ist als erste autoritative Korrektur fest hinterlegt und darf nicht als Selbstbericht verwendet werden.

### 6. Wochen-/Monatskonsolidierung

`memory_consolidations` speichert longitudinal:

- Zusammenfassung des Zeitraums,
- Veränderungen,
- stabile Muster,
- offene Fragen,
- wichtigste Memory-Keys,
- Quellenanzahl.

Aktuelle Wochen- und Monatskonsolidierungen werden beim Abschluss einer Therapiesitzung aktualisiert. Sie können auf `/memory` zusätzlich manuell neu erzeugt werden.

### 7. Thematisches Retrieval

Vor **jeder** Antwort im Therapiechat wird die aktuelle User-Nachricht als Retrieval-Query verwendet.

Hybridmodus mit `OPENAI_API_KEY`:

1. aktive Memories werden mit `text-embedding-3-small` als 256-dimensionale Vektoren indexiert;
2. Query wird eingebettet;
3. Ranking kombiniert semantische Ähnlichkeit, Wortüberlappung, Wichtigkeit und zeitliche Nähe;
4. wichtige stabile Memories werden zusätzlich unabhängig vom Query geladen;
5. aktive Korrekturen und aktuelle Wochen-/Monatskonsolidierungen werden immer mitgegeben.

Ohne OpenAI-Key bleibt die Datenbank vollständig nutzbar. Retrieval fällt auf lexikalisches + Importance-/Recency-Ranking zurück.

PostgreSQL bleibt Standard-PostgreSQL; pgvector ist derzeit **keine** notwendige Infrastrukturabhängigkeit. Embeddings werden als JSONB gespeichert. Für die erwartete Single-Patient-Größe ist dies bewusst einfach und portabel. Bei sehr großen Datenmengen kann später auf pgvector migriert werden, ohne das Memory-Datenmodell zu ändern.

## Tabellen

### `therapeutic_memories`

- `memory_key` – stabiler/idempotenter Schlüssel
- `memory_type` – episodic / semantic / formulation / hypothesis / milestone / correction
- `title`, `content`
- `domains`
- `importance`, `confidence`
- `status` – active / superseded / retracted
- `occurred_at`
- `source_type`, `source_id`, `source_label`
- `embedding`, `embedding_model`

### `memory_sources`

Mehrfach-Provenienz für einen Memory-Eintrag mit Source-Excerpt und Metadaten.

### `memory_corrections`

Explizite falsche vs. korrigierte Aussage inklusive Grund und Quelle.

### `memory_consolidations`

Wochen-/Monats-/Phasen-Snapshots.

### `memory_retrieval_events`

Audit-Log, welche Memory-Keys für welche Therapienachricht in den Kontext geladen wurden. Damit kann später nachvollzogen werden, warum die KI eine alte Information berücksichtigt oder nicht berücksichtigt hat.

## Kontextstrategie

Der Systemprompt enthält künftig vier Zeithorizonte gleichzeitig:

1. aktueller Therapieplan / aktive Phase;
2. aktuelle Tage/Woche und jüngste Situationen;
3. aktuelle versionierte Fallformulierung und Arbeitshypothesen;
4. Langzeitgedächtnis mit relevanten älteren Episoden, stabilen Memories, Korrekturen und Verlaufskonsolidierungen.

Damit muss nicht der gesamte einjährige Chat in jedes Prompt kopiert werden. Die KI bekommt gezielt die relevante Vorgeschichte.

## Umgebungsvariablen

Optional:

```env
MEMORY_EMBEDDING_MODEL=text-embedding-3-small
MEMORY_EMBEDDING_DIMENSIONS=256
MEMORY_SYNTHESIS_MODEL=gpt-4o-mini
```

Ohne diese Werte werden die genannten Defaults verwendet.

## UI

Neue Seite: `/memory` / **Langzeitgedächtnis**

Sie zeigt:

- Anzahl aktiver episodischer/semantischer/Hypothesen-Memories;
- Suche im gesamten Langzeitgedächtnis;
- aktiven Retrieval-Modus;
- autoritative Korrekturen;
- Wochen-/Monatskonsolidierungen;
- zuletzt gespeicherte Memories inklusive Quelle;
- manuelles Aktualisieren der aktuellen Konsolidierungen.

## Leitprinzipien

- Speicher ≠ Wahrheit.
- Raw Data bleibt Raw Data.
- Fakten, Selbstbericht und Hypothese werden nicht vermischt.
- Korrekturen überschreiben den Interpretationsvorrang, nicht die historische Rohquelle.
- Alte widersprechende Informationen werden nicht heimlich gelöscht.
- Die KI soll bei Widersprüchen klären, nicht raten.
- Ziel ist langfristige therapeutische Kontinuität statt maximale Datenmenge im Prompt.
