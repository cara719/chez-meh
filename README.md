# Chez Meh

A shared restaurant diary. Food and delivery are rated separately. Next.js on Vercel, data in Turso.

## Settings (Vercel > Project > Settings > Environment Variables)
- `TURSO_DATABASE_URL`: the database URL (starts with `libsql://`)
- `TURSO_AUTH_TOKEN`: the database token
- `APP_PASSPHRASE`: the shared passphrase. Sign-in lasts 30 days. Changing it signs everyone out.
- `ANTHROPIC_API_KEY`: optional. Turns on the round icon at the bottom right, which reads a receipt photo or order screenshot and fills in the Log form. Without it everything else works and the button explains the key is missing. `RECEIPT_MODEL` overrides the model (default `claude-sonnet-5`).

The `meals` table is created automatically on first use.

## Local
`npm install`, then `APP_PASSPHRASE=something npm run dev`. With no Turso settings it uses a local `local.db` file.
`npm test` checks the query rules from the spec.

## Layout
- `src/app.html`: the diary page (form, questions, diary)
- `src/login.html`: passphrase page
- `app/api/entries`: save and list meals (validates ratings 1 to 5)
- `lib/validate.js`, `lib/db.js`, `lib/auth.js`, `middleware.js`

## Phase 2
Receipt or screenshot upload that prefills the form (needs an `ANTHROPIC_API_KEY`).
