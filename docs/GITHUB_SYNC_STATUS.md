# GitHub Sync-Status

`sync-status.json` is a deliberately non-content-bearing technical manifest that can be committed to GitHub to verify that the local PostgreSQL state has moved forward without publishing therapy ratings, notes, messages, hypotheses, or other clinical content.

## Generate

After saving a check-in in the local app:

```bash
npm run sync:status
```

The command connects to the same PostgreSQL database used by the app. If `DATABASE_URL` is not set, it uses the local Docker Compose default:

```text
postgres://therapy:therapy_password@localhost:5433/therapy
```

It updates the tracked root file `sync-status.json`.

## What is included

Only technical metadata is exported:

- `generated_at`
- `last_checkin_at`
- `checkin_count`
- `active_memory_count`
- `latest_memory_updated_at`
- `completed_session_count`
- `state_hash`

`state_hash` is SHA-256 over those database metadata fields only. It does **not** hash ratings or therapy content.

## What is intentionally excluded

The generator never selects or exports:

- mood or other 0–10 ratings
- notes
- therapy messages
- session summaries or insights
- hypotheses/formulation text
- memory content
- patient profile data
- record IDs

The CI workflow validates the manifest shape and rejects known sensitive field names.

## Verification workflow

1. Save the check-in in the app.
2. Run `npm run sync:status`.
3. Inspect `git diff -- sync-status.json` if desired.
4. Commit and push `sync-status.json`.
5. A remote reader with GitHub access can verify that timestamps/counts/hash changed without seeing the underlying therapy data.

Because the repository may be public, treat even these timestamps and counts as public metadata once committed. The manifest is intentionally minimal for that reason.
