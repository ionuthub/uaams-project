# Architecture Overview

**Issue:** #22 - Draft architecture overview

**Owners:** Silvana and Dawid

**Implementation review:** Ionut compared this document with the current `develop` code on 15 July 2026. Dawid's owner confirmation remains required on the issue.

## Purpose

This document explains the Sprint 2 UAAMS proof-of-concept architecture. It separates the code that exists now from planned Sprint 2 integration so the report does not present unfinished work as implemented.

## Current Implementation

| Area | Current implementation | Main files |
|---|---|---|
| Web application | Next.js 15 App Router with React 19 | `app/`, `package.json` |
| Authentication UI | Register, login, verification guidance/action and password-reset request/action routes | `app/register`, `app/login`, `app/verify-email`, `app/reset-password` |
| Firebase client boundary | Lazy Firebase Auth, Firestore and Storage getters using environment configuration | `lib/firebase.js` |
| Authentication services | Registration, student profile creation, login, logout, verification and password reset | `lib/auth.js` |
| Application services | Draft creation, submission, student queries, university-scoped admin queries and atomic decisions | `lib/db.js` |
| Document services | PDF/JPG/PNG validation, Storage upload and application-path update | `lib/storage.js`, `storage.rules` |
| Security | Verified-user checks, owner access, admin university scoping, field allow-lists and append-only decisions | `firestore.rules`, `storage.rules` |
| Demo data | Seeded university and verified admin profile using Firebase Admin | `scripts/seed.js` |
| Deployment | GitHub-connected Vercel previews and production deployment | Vercel project and GitHub pull requests |

The root route still contains Dawid's temporary integration harness for application/admin testing. The dedicated student dashboard, application form, upload screen and admin screens are later Sprint 2 work and must not be described as finished UI.

## Module Responsibilities

| Module | Responsibility | Owner |
|---|---|---|
| Student authentication | Register, verify email, log in and reset password | Dawid / Elena |
| Student dashboard | Show owned applications and status badges | Elena |
| Application form | Capture required fields and attach one document | Elena / Dawid |
| Admin dashboard | List and review applications scoped to the admin university | Ionut |
| Decision flow | Offer or reject with a custom message and status update | Ionut |
| Email system | Firebase Auth sends verification/reset emails; Resend is selected for decision emails and email logs | Sorin; Ionut completed the provider decision as catch-up work |
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

Future decision-email path:
Admin browser -> protected Next.js server route -> Firebase Admin + Resend
```

Client pages should use the shared `lib/` functions instead of creating separate Firebase access patterns. Firebase client configuration is visible to the browser by design, but access is protected by Firebase Authentication and deployed security rules.

Server credentials are different:

- `serviceAccountKey.json` is local seed-only data and must never be committed.
- `RESEND_API_KEY` and any future Firebase Admin server credentials belong only in Vercel server-side environment variables.
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
3. The document service validates and uploads one file, then stores its path in `documentPath`.
4. Submission changes the status to `submitted` and adds `submittedAt`.
5. An admin profile supplies `role: admin` and `universityId`.
6. The admin query filters applications by that university and supported queue statuses.
7. Firestore rules independently enforce the same university boundary.
8. `recordDecision()` writes the application status/message and a new decision-history entry in one batch.

The current code does not yet require a non-null `documentPath` before submission and does not reject a blank decision message. These are implementation gaps recorded in `docs/test-plan.md`.

## Email Flow

Resend is selected for decision emails, but issue #17 has not implemented it yet. The planned path is:

1. The admin decision batch completes successfully.
2. The browser sends only `applicationId` plus the Firebase ID token to a protected Next.js server route.
3. The server verifies the token, admin role and university scope.
4. The server reads the committed decision/message and student email from Firestore.
5. Resend sends the decision email.
6. The server writes a success or failure entry to `emailLogs`.

The server must not trust a browser-supplied recipient, decision or message. A failed email must not undo an already committed application decision.

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
- Uploaded documents are limited to PDF, JPG or PNG and 10 MB.
- Storage reads are restricted to the owning student or scoped admin.
- Client deletion is disabled for users, applications, decisions, email logs and documents.
- Email sending must be server-side and must verify the caller again.

## Current Blockers and Deferred Work

| Item | Status |
|---|---|
| Firebase Storage bucket | Blocked by the team's Blaze-plan decision; code and rules exist but live upload is not proven |
| Student dashboard/form/admin UI | Planned for later Sprint 2 issues; only the temporary harness currently exercises these services |
| Decision email | Resend selected; domain/DNS access and issue #17 implementation remain |
| Email logs | Collection is planned; the final server writer and retention policy remain |
| Firebase email template action URLs | Must be checked in the Firebase console for the merged `/verify-email` and `/reset-password` routes |
| Duplicate applications | One application per student/university is not yet enforced |
| GDPR deletion | Delete/anonymise behaviour is deferred pending IS-06 |

## Verification Sources

Technical statements in this document should be checked against:

- `app/` for current routes and user flows;
- `lib/auth.js`, `lib/db.js`, `lib/firebase.js` and `lib/storage.js` for service contracts;
- `firestore.rules` and `storage.rules` for client permissions;
- `firestore.indexes.json` for reproducible composite indexes;
- `scripts/seed.js` for demo university/admin data;
- `docs/email-provider-decision.md` and `docs/test-plan.md` for selected integration and acceptance gaps.
