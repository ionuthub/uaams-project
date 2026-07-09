# UAAMS | University Administration and Application Management System

Sprint 2 proof of concept. Next.js 15 (App Router, plain JS) + Firebase (Auth, Firestore, Storage).

**Live deployment:** [Vercel URL : Ionut]
**Firebase project:** `uaams-53262` (console: https://console.firebase.google.com/project/uaams-53262)

---

## What's in this repo

| Path | What it is | Owner |
|---|---|---|
| `lib/firebase.js` | Firebase client initialisation (reads `.env.local`) | Dawid |
| `lib/auth.js` | Register, email verification, login, password reset, profile lookup | Dawid |
| `lib/db.js` | Firestore data model: applications CRUD, admin scoping, decision flow with audit log | Dawid |
| `lib/storage.js` | Document upload with IS-07 validation (10 MB; PDF/JPG/PNG) | Dawid |
| `firestore.rules` | Security rules (deployed) : role checks, university scoping, append-only decisions | Dawid |
| `storage.rules` | Storage rules : IS-07 server-side, owner/scoped-admin reads (IS-04) | Dawid |
| `scripts/seed.js` | Creates the demo university and admin account | Dawid |
| `app/page.js` | **Temporary backend test harness** : replaced by Elena's screens; `lib/` stays | Dawid |

Front end (Elena), admin module (Ionut), emails (Sorin): build on top of `lib/` : Please do not call Firebase directly.

---

## First-time setup (every team member)

Prerequisites: Node 18+ and Git.

```bash
git clone <repo-url>
cd uaams
npm install
```

### Environment variables (required : the app will not start without them)

1. Copy the template: `cp .env.local` (PowerShell: `Copy-Item  .env.local`)
2. Ask Dawid for the six Firebase config values, or get them yourself: Firebase console → gear icon → Project settings → Your apps → `uaams-web` → SDK setup and configuration.
3. Paste each value against its variable name in `.env.local`. No quotes, no spaces around `=`.

**Never commit `.env.local` or `serviceAccountKey.json`.** Both are gitignored : keep it that way. Do not paste them into the group chat.

### Run it

```bash
npm run dev
```

Open http://localhost:3000. You should see the test scaffold (until Elena's screens replace it).

---

## Test accounts

| Role | Email | Password |
|---|---|---|
| Admin (seeded, Solent) | `admin@solent-demo.test` | ask Dawid: not stored in the repo |
| Student | register your own via the harness | Nill |

Student accounts must **verify their email** (check spam for `noreply@uaams-53262.firebaseapp.com`) before they can create applications : the security rules enforce this, not just the UI.

To test the full demo path you need both roles at once: use a normal window for the student and an **incognito/private window** for the admin, otherwise the second login replaces the first.

---

## The demo path (what "working" means this sprint)

1. Student registers → verification email arrives → clicks link → logs in
2. Student loads universities → applies → (uploads a document : pending Storage setup) → submits
3. Admin logs in → sees the application, scoped to their university only
4. Admin clicks Offer or Reject with a message → decision is written to the audit log
5. Student refreshes → status has flipped and the message is visible
6. (Sorin) Decision email is sent and logged : hook point: after `recordDecision()` in `lib/db.js`

---

## Admin tasks (Dawid, or whoever has console access)

**Deploy rules after changing them:**
```bash
firebase use uaams-53262        # once per machine
firebase deploy --only firestore:rules,storage
```
(While Storage is not enabled: `firebase deploy --only firestore:rules`)

**Re-seed demo data:** put `serviceAccountKey.json` in the project root (console → Project settings → Service accounts → Generate new private key), then:
```bash
npm run seed
```
Change the placeholder password in `scripts/seed.js` before running against a shared project.

---

## Troubleshooting (all of these actually happened)

| Symptom | Cause | Fix |
|---|---|---|
| `auth/invalid-api-key` on startup | `.env.local` missing or empty | Fill it in (see setup above), restart `npm run dev` |
| `permission-denied` on register or any write | Rules not deployed, or you're doing something the rules forbid | Deploy rules; check you're verified and using the right role |
| `EMAIL_NOT_VERIFIED` / can't apply | Verification link not clicked | Check inbox and spam, click it, log in again |
| `auth/email-already-in-use` | Account exists from an earlier attempt | Log in instead, or delete the user in console → Authentication |
| `failed-precondition ... requires an index` | Firestore composite index missing | Click the link in the error, Create index, wait for **Enabled**, retry. Two already exist; new query shapes may need new ones |
| `Cannot read properties of null` | Clicked a button while signed out / wrong role | Log in with the right account |
| Storage upload fails | Storage not yet enabled (Blaze plan decision pending : see issues log) | Blocked on team decision |

---

## Firestore data model (summary : full schema doc in section 4 / Cornel)

- `/users` : `{ fullName, email, role: "student"|"admin", universityId, createdAt }`. Role is fixed to `student` on self-registration; admins are seed-only. Self-promotion is blocked by rules.
- `/universities` : seeded reference data, read-only from the client.
- `/applications` : `{ studentUid, universityId, status, form, documentPath, latestDecisionMessage, timestamps }`. Status: `draft → submitted → under_review → offer | rejected`.
- `/applications/{id}/decisions` : append-only audit log `{ decision, message, decidedBy, decidedAt }`. Decisions are never edited or deleted; a reversal is a new logged decision (IS-05).
- `/emailLogs` : one doc per send, written by the email module (retention pending IS-06).

Composite indexes (required, already created): `applications(studentUid, createdAt)` and `applications(status, universityId, submittedAt)`.

---

## Known gaps / deferred to Sprint 3

- Storage + document upload (blocked: Blaze plan decision)
- Duplicate-application prevention (one per student per university)
- Field-level validation in security rules; App Check
- GDPR delete cascade (pending IS-06: anonymise vs delete email logs)
- Emulator-based automated rules tests
