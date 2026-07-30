# Architecture Overview

**Issues:** #22 - Draft architecture overview; #69 - Document model and required-document rule

**Owners:** Silvana and Dawid

**Implementation review:** Updated against `develop` commit `03f9490` on 30 July 2026, including the typed-document implementation in `app/apply/page.js`, `lib/db.js`, `lib/storage.js`, `lib/upload-policy.mjs`, `firestore.rules` and `storage.rules`.

## Purpose

This document explains the implemented UAAMS architecture. It separates code that exists from deferred work so the report does not present unfinished functionality as implemented.

## Current Implementation

| Area | Current implementation | Main files |
|---|---|---|
| Web application | Next.js 15 App Router with React 19 | `app/`, `package.json` |
| Authentication UI | Register, login, verification guidance/action and password-reset request/action routes | `app/register`, `app/login`, `app/verify-email`, `app/reset-password` |
| Firebase client boundary | Lazy Firebase Auth, Firestore and Storage getters using environment configuration | `lib/firebase.js` |
| Authentication services | Registration, student profile creation, login, logout, verification and password reset | `lib/auth.js` |
| Application services | Draft creation, submission, student queries, university-scoped admin queries and atomic decisions | `lib/db.js` |
| Document services | Typed supporting-document upload, PDF/JPG/PNG and 10 MB validation, Storage access control, and application metadata updates | `app/apply/page.js`, `lib/storage.js`, `lib/upload-policy.mjs`, `firestore.rules`, `storage.rules` |
| Security | Verified-user checks, owner access, admin university scoping, field allow-lists and append-only decisions | `firestore.rules`, `storage.rules` |
| Demo data | Seeded university and verified admin profile using Firebase Admin | `scripts/seed.js` |
| Notification and email backend | Protected welcome, submission, under-review and decision endpoints; server-created in-app notifications; Resend delivery and deterministic email logging | `app/api/email/`, `lib/firebase-admin.js`, `lib/email.js`, `lib/db.js` |
| Deployment | GitHub-connected Vercel previews and production deployment | Vercel project and GitHub pull requests |

The root route is the public product entry. The implemented applicant routes include `/student` for status tracking and `/apply` for university selection, required application data, draft creation, upload and submission. `/admin` provides the initial university-scoped application list. The internal harness is restricted to `/dev/harness` when explicitly enabled.

## Module Responsibilities

| Module | Responsibility | Owner |
|---|---|---|
| Student authentication | Register, verify email, log in and reset password | Dawid / Alina |
| Student dashboard | Show owned applications and status badges | Alina |
| Application form | Capture required fields and attach three required document types plus an optional English-language test | Alina / Dawid |
| Admin dashboard | List and review applications scoped to the admin university | Ionut |
| Decision flow | Offer or reject with a custom message and status update | Ionut |
| Notification and email system | Firebase Auth sends verification/reset emails; protected routes send welcome, submission, under-review and decision emails through Resend and create the related in-app notifications | Sorin / Ionut |
| Data model and security | Firestore collections, rules, seed data, indexes and Storage permissions | Dawid |
| Architecture and schema documentation | Keep technical documentation aligned with implemented code | Silvana / Dawid |
| Test planning and smoke checks | Define and execute acceptance, integration and demo-path tests | Cornel; Ionut completed the Week 1 test-plan draft as catch-up work |

## Browser and Service Boundaries

```text
Browser / Next.js client pages
        |
        | calls shared functions
        v
lib/auth.js   lib/db.js   lib/storage.js
        |          |             |
        v          v             v
Firebase Auth   Firestore   Firebase Storage
                     |
                     v
             Firestore/Storage rules

Transactional notification path:
Student/admin browser -> protected Next.js server route -> Firebase Admin + Resend
                                                   |
                                                   v
                                  Firestore notifications + emailLogs
```

Client pages should use the shared `lib/` functions instead of creating separate Firebase access patterns. Firebase client configuration is visible to the browser by design, but access is protected by Firebase Authentication and deployed security rules.

Server credentials are different:

- `serviceAccountKey.json` is local seed-only data and must never be committed.
- `RESEND_API_KEY`, `EMAIL_FROM` and `FIREBASE_ADMIN_*` credentials belong only in Vercel server-side environment variables.
- Server secrets must never use the `NEXT_PUBLIC_` prefix.

## Authentication Flow

1. `/register` validates the form and calls `registerStudent()`.
2. Firebase Authentication creates the account.
3. Firestore receives `/users/{uid}` with role `student`.
4. Firebase sends the verification email.
5. `/verify-email` can apply a valid `oobCode` when the Firebase template action URL points to that route.
6. `/login` calls the shared login function and keeps unverified students out of protected application functions.
7. `/reset-password` supports both requesting and confirming a reset.

Firebase Authentication remains responsible for verification and password-reset email security. Resend does not replace these flows.

## Application and Admin Flow

1. A verified student creates a `draft` application for a university.
2. Application form data is stored in the application's `form` object.
3. The document service validates and uploads typed files for `passportCopy`, `transcripts`, `certificates` and optional `englishTest`.
4. Each upload is recorded under `applications.documents.{docType}` with `path`, `name` and `uploadedAt`. The latest path is also written to legacy `documentPath` so older records and views remain compatible.
5. The application page, `submitApplication()` and Firestore rules all require the three mandatory document paths before submission.
6. Submission changes the status to `submitted` and adds `submittedAt`.
7. An admin profile supplies `role: admin` and `universityId`.
8. The admin query filters applications by that university and supported queue statuses.
9. Firestore and Storage rules independently enforce the same university boundary.
10. `recordDecision()` writes the application status/message and a new decision-history entry in one batch.

The required-document rule is deliberately enforced at three layers. The page disables or blocks submission and names missing documents, `submitApplication()` throws `DOCUMENTS_REQUIRED` if any required path is absent, and Firestore rules reject a direct `draft -> submitted` write unless all three paths are strings. The optional `englishTest` entry is not part of this gate.

### Document upload and access flow

1. A verified student chooses a supported file for a document type.
2. `validateUploadFile()` provides a friendly client error for a missing file, an unsupported type or a file larger than 10 MB.
3. `uploadTypedDocument()` writes the object below `applications/{applicationId}/` using the document type as a filename prefix.
4. Storage rules independently enforce the size, MIME type and application ownership requirements.
5. Firestore stores document metadata inside the application rather than in a separate top-level `documents` collection.
6. The verified application owner or an admissions admin whose `universityId` matches the application may read the stored object.

The embedded map is the current implementation:

```text
applications/{applicationId}
  documents:
    passportCopy: { path, name, uploadedAt }   # required
    transcripts:  { path, name, uploadedAt }  # required
    certificates: { path, name, uploadedAt }  # required
    englishTest:  { path, name, uploadedAt }  # optional
```

## Notification and Email Flow

Four protected Next.js routes send the retained transactional email events:

| Event | Server route | Deterministic email-log ID | In-app notification |
|---|---|---|---|
| Account welcome | `/api/email/welcome` | `welcome-{uid}` | No application notification |
| Application submitted | `/api/email/submission` | `submission-{applicationId}` | Application received |
| Application under review | `/api/email/status` | `status-under_review-{applicationId}` | Review started |
| Offer or rejection | `/api/email/decision` | `decision-{applicationId}-{decisionId}` | Decision available |

Each route verifies a Firebase ID token and checks the caller against the event it is allowed to trigger. Application routes read trusted application, student and university data on the server instead of accepting an email address or decision message from the browser. The status route additionally requires the committed status to be `under_review`; the decision route requires a committed append-only decision.

Before sending, the route claims its deterministic `emailLogs` document. An existing `sent` result is returned without sending again, while a recent `sending` lease blocks a concurrent duplicate. Resend receives the same deterministic idempotency key, and the server records `sent` or `failed` evidence after the attempt. A failed email does not roll back an already committed application state.

Submission, status and decision routes also create one deterministic `/notifications/{noticeId}` document through Firebase Admin. Each notification contains `userId`, `applicationId`, `message`, `readStatus` and `createdAt`. A verified student can read only notifications whose `userId` matches their account and may change only `readStatus` to `true`; browser create/delete access is denied.

## Deployment Flow

1. Team members work on feature branches.
2. Pull requests target `develop` and receive a Vercel preview.
3. Reviewed and tested changes merge into `develop`.
4. A release pull request compares `develop` with `main`.
5. `main` is merged only after the release build and smoke checks pass.
6. Vercel production deploys the approved `main` commit.

Required browser-side Firebase settings are stored in Vercel Preview and Production environments as `NEXT_PUBLIC_FIREBASE_*` variables. `NEXT_PUBLIC_APP_URL` must match the relevant deployment URL for Firebase continuation links.

## Security Decisions

- Students can read only their own applications.
- Admins can read/write only applications for their assigned university.
- Students can create only `draft` applications and edit allow-listed draft fields.
- Decision history is append-only and is written atomically with the current status.
- Uploaded documents are limited to PDF, JPG or PNG and 10 MB. Client validation and Storage rules both enforce the policy.
- Submission requires `documents.passportCopy.path`, `documents.transcripts.path` and `documents.certificates.path`; `documents.englishTest` remains optional.
- Storage reads are restricted to the owning student or scoped admin.
- Client deletion is disabled for users, applications, decisions, notifications, email logs and documents.
- Notifications are created only by protected server routes; students can read their own and only mark an unread notification as read.
- Email sending must be server-side and must verify the caller again.

## Current Limitations and Deferred Work

| Item | Status |
|---|---|
| Firebase Storage bucket | Live typed uploads, required-document blocking, type rejection and size rejection were verified on production on 30 July 2026; evidence is recorded in issue #25 |
| Student dashboard/form/admin UI | Implemented and exercised through the production demo path recorded in issue #25 |
| Transactional email | Welcome, submission, under-review and decision routes are implemented through Resend and the verified `uaams.website` domain; production delivery passed, with some Gmail messages initially classified as Spam |
| In-app notifications | Submission, under-review and decision events create server-side notifications; own-user reads and one-way read-state updates are enforced by Firestore rules |
| Email logs | Implemented with server-side writes and university-scoped admin reads; the retention policy remains deferred |
| Firebase email template action URLs | Must be checked in the Firebase console for the merged `/verify-email` and `/reset-password` routes |
| Duplicate applications | One application per student/university is not yet enforced |
| GDPR deletion | Delete/anonymise behaviour is deferred pending IS-06 |

## Verification Sources

Technical statements in this document should be checked against:

- `app/` for current routes and user flows, including the four routes below `app/api/email/`;
- `lib/auth.js`, `lib/db.js`, `lib/firebase.js` and `lib/storage.js` for service contracts;
- `firestore.rules` and `storage.rules` for client permissions;
- `firestore.indexes.json` for reproducible composite indexes;
- `scripts/seed.js` for demo university/admin data;
- `docs/email-provider-decision.md` and `docs/test-plan.md` for selected integration and acceptance gaps;
- issue #25 and `UAAMS_Test_Record_Week4.docx` for production evidence covering required uploads, missing-document blocking, invalid types and the 10 MB limit.
