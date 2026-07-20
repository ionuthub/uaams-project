# UAAMS - Backend setup guide

Sprint 2 proof of concept. Next.js 15 (App Router, plain JS) + Firebase (Auth, Firestore, Storage).

**Firebase project:** `uaams-53262` (console: https://console.firebase.google.com/project/uaams-53262)

---

## What's in the backend

| Path | What it is | Owner |
|---|---|---|
| `lib/firebase.js` | Firebase client initialisation (reads `.env.local`) | Dawid |
| `lib/auth.js` | Register, email verification, login, password reset, profile lookup | Dawid |
| `lib/db.js` | Firestore data model: applications CRUD, admin scoping, atomic decision flow with audit log | Dawid |
| `lib/storage.js` | Document upload with IS-07 validation (10 MB; PDF/JPG/PNG) | Dawid |
| `firestore.rules` | Security rules (deployed) - role checks, university scoping, field-level allow-lists, append-only decisions | Dawid |
| `storage.rules` | IS-07 enforced server-side; owner/scoped-admin reads (IS-04) | Dawid |
| `scripts/seed.js` | Creates the demo university and admin account | Dawid |
| `lib/firebase-admin.js` | Server-only Firebase Admin connection for protected routes | Ionut (email catch-up) |
| `app/api/email/decision/route.js` | Scoped decision-email send and `emailLogs` writer | Ionut (email catch-up) |
| `app/page.js` | **Temporary backend test harness** - replaced by Alina's screens; `lib/` stays | Dawid |

Front end (Alina), admin module (Ionut), emails (Sorin): build on top of `lib/` - do not call Firebase directly.

---

## First-time setup (every team member)

Prerequisites: Node 18+ and Git.

```bash
git clone https://github.com/ionuthub/uaams-project.git
cd uaams-project
npm install
```

### Environment variables (required - the app will not start without them)

1. Copy the template:
   ```bash
   cp .env.local.example .env.local
   ```
   (PowerShell equivalent: `Copy-Item .env.local.example .env.local`)
2. Ask Dawid for the six Firebase config values, or get them yourself: Firebase console → gear icon → Project settings → Your apps → `uaams-web` → SDK setup and configuration.
3. Paste each value against its variable name in `.env.local`. No quotes, no spaces around `=`.

The decision-email route also needs these server-only values locally and in Vercel Preview/Production:

```text
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
RESEND_API_KEY
EMAIL_FROM
```

Obtain the Firebase service-account values from Dawid or a Firebase project owner. Preserve the private key's line breaks; escaped `\n` values are also accepted. These values must never use the `NEXT_PUBLIC_` prefix.

**Never commit `.env.local` or `serviceAccountKey.json`.** Both are gitignored - keep it that way. Do not paste them into the group chat.

### Run it

```bash
npm run dev
```

Set `ENABLE_TEST_HARNESS=true` in `.env.local`, then open http://localhost:3000/dev/harness to use the temporary backend test harness. The route returns Not Found when the server-only flag is absent, including on production by default.

Firebase Authentication uses one custom action-handler URL for verification and password-reset actions:

```text
https://uaams-project.vercel.app/auth/action
```

Firebase supplies `mode` and `oobCode`. The handler validates those parameters and routes verification to `/verify-email` and password reset to `/reset-password`, where the existing screens complete the action. Add the stable Vercel domain to Firebase Authentication authorised domains before testing production emails.

---

## Test accounts

| Role | Email | Password |
|---|---|---|
| Admin (seeded, Solent) | `admin@solent.test` | ask Dawid - not stored in the repo |
| Student | register your own via the harness | - |

Student accounts must **verify their email** (check spam for `noreply@uaams-53262.firebaseapp.com`) before they can create applications - the security rules enforce this, not just the UI.

To test the full demo path you need both roles at once: use a normal window for the student and an **incognito/private window** for the admin, otherwise the second login replaces the first.

---

## The demo path (what "working" means this sprint)

1. Student registers → verification email arrives → clicks link → logs in
2. Student loads universities → applies → (uploads a document - pending Storage setup, IS-08) → submits
3. Admin logs in → sees the application, scoped to their university only
4. Admin clicks Offer or Reject with a message → the status update and the audit-log entry are written together in one atomic batch
5. Student refreshes → status has flipped and the message is visible
6. The issue #15 interface calls `POST /api/email/decision` after `recordDecision()` succeeds; the route sends the committed decision and writes `emailLogs`

---

## Admin tasks (Dawid, or whoever has console access)

**Deploy rules after changing them:**
```bash
firebase use uaams-53262        # once per machine
firebase deploy --only firestore:rules,storage
```
(While Storage is not enabled: `firebase deploy --only firestore:rules`)

**Re-seed demo data:**
1. Put `serviceAccountKey.json` in the project root (console → Project settings → Service accounts → Generate new private key). It is gitignored - never commit or share it.
2. Set the admin password (never committed; PowerShell):
   ```powershell
   $env:SEED_ADMIN_PASSWORD="your-password"
   ```
   (bash/mac: `export SEED_ADMIN_PASSWORD="your-password"`)
3. Run:
   ```bash
   npm run seed
   ```
   If the admin account already exists, the seed updates its password to the value you set.

---

## Troubleshooting (all of these actually happened - don't panic)

| Symptom | Cause | Fix |
|---|---|---|
| `auth/invalid-api-key` on startup | `.env.local` missing or empty | Fill it in (see setup above), restart `npm run dev` |
| `permission-denied` on register or any write | Rules not deployed, or the write touches a field your role isn't allowed to change | Deploy rules; check you're verified, using the right role, and only writing allow-listed fields |
| `EMAIL_NOT_VERIFIED` / can't apply | Verification link not clicked | Check inbox and spam, click it, log in again |
| `auth/email-already-in-use` | Account exists from an earlier attempt | Log in instead, or delete the user in console → Authentication |
| `failed-precondition ... requires an index` | Firestore composite index missing | Click the link in the error, Create index, wait for **Enabled**, retry |
| `Cannot read properties of null` | Clicked a button while signed out / wrong role | Log in with the right account |
| Seed exits with "Set SEED_ADMIN_PASSWORD" | Env variable not set in this terminal session | Set it (see re-seed step 2) and run again |
| Storage upload fails | Storage not yet enabled (Blaze plan decision pending - IS-08) | Blocked on team decision |

---

## Firestore data model (summary - full schema doc in the report, section 3)

- `/users` - `{ fullName, email, role: "student"|"admin", universityId, createdAt }`. Role is fixed to `student` on self-registration; admins are seed-only. Clients can only update `fullName`.
- `/universities` - seeded reference data, read-only from the client.
- `/applications` - `{ studentUid, universityId, status, form, documentPath, latestDecisionMessage, timestamps }`. Status: `draft → submitted → under_review → offer | rejected`. Students may edit draft fields only and may move draft → submitted; admins may write decision fields only (field-level allow-lists in the rules).
- `/applications/{id}/decisions` - append-only audit log `{ decision, message, decidedBy, decidedAt }`. Written atomically with the status update; never edited or deleted (IS-05).
- `/emailLogs` - one server-written document per decision email, including scope, status, attempts and provider message ID; client writes are denied (retention pending IS-06).

Composite indexes (required, exported to `firestore.indexes.json`): `applications(studentUid, createdAt)` and `applications(status, universityId, submittedAt)`.

---

## Known gaps / deferred to Sprint 3

- Storage bucket + document upload (blocked: Blaze plan decision, IS-08)
- Duplicate-application prevention (one per student per university)
- Value-format validation in security rules; App Check
- GDPR delete cascade (pending IS-06: anonymise vs delete email logs)
- Emulator-based automated rules tests
