# Schema Documentation

**Issue:** #23 - Draft schema documentation

**Owners:** Silvana and Dawid

**Implementation review:** Ionut compared this document with `lib/auth.js`, `lib/db.js`, `lib/storage.js`, `scripts/seed.js`, `firestore.rules` and `storage.rules` on 15 July 2026. Dawid's owner confirmation remains required on the issue.

## Purpose

This document records the Firestore and Storage structures currently used by the Sprint 2 proof of concept. Planned structures are labelled clearly.

## Implemented Firestore Structure

```text
/users/{uid}
/universities/{universityId}
/applications/{applicationId}
/applications/{applicationId}/decisions/{decisionId}

/emailLogs/{logId}  (planned writer/schema in issue #17)
```

There are no implemented top-level `documents`, `messages` or `decisions` collections. A document is represented by `applications.documentPath`; the latest student-facing message is stored in `applications.latestDecisionMessage`; full decision history is stored below each application.

## Users

Path: `/users/{uid}` where `uid` matches the Firebase Authentication user ID.

| Field | Type | Required | Source and meaning |
|---|---|---|---|
| `fullName` | string | Yes | Student registration or seeded admin profile |
| `email` | string | Yes | Email associated with the Firebase Auth account |
| `role` | string | Yes | `student` or `admin` |
| `universityId` | string or null | Yes | Admin scope; student registration currently stores `null` |
| `createdAt` | timestamp | Yes | Server timestamp at profile creation/seed |
| `updatedAt` | timestamp | Optional | Allowed when a student updates `fullName`; no current UI writes it |

Client rules allow a signed-in user to read their own profile. Self-registration must create role `student`. Admin profiles are created by the seed script through Firebase Admin. Client updates are limited to `fullName` and `updatedAt`.

## Universities

Path: `/universities/{universityId}`.

| Field | Type | Required | Source and meaning |
|---|---|---|---|
| `name` | string | Yes | Display name |
| `city` | string | Yes for current seed | University city |
| `createdAt` | timestamp | Yes for current seed | Server timestamp |

The current seed creates document ID `solent`. Signed-in users can read universities; client writes are denied.

## Applications

Path: `/applications/{applicationId}` with an automatically generated ID.

| Field | Type | Required | Source and meaning |
|---|---|---|---|
| `studentUid` | string | Yes | Owning Firebase Auth user ID |
| `universityId` | string | Yes | University receiving the application and admin-scope key |
| `status` | string | Yes | One of the supported status values below |
| `form` | map | Yes | Step 1 and step 4 application data; exact UI fields remain owned by issue #10 |
| `documentPath` | string or null | Yes | Firebase Storage object path; starts as `null` |
| `createdAt` | timestamp | Yes | Server timestamp when the draft is created |
| `updatedAt` | timestamp | Yes | Server timestamp for the latest allowed change |
| `submittedAt` | timestamp | Required after submission | Added when status becomes `submitted` |
| `latestDecisionMessage` | string | Required after decision | Latest admin message shown to the student |

The current helper creates a new draft every time and does not check for an existing application for the same student/university.

## Application Statuses

| Status | Set by | Meaning |
|---|---|---|
| `draft` | Student creation/edit | Application is editable by its owner |
| `submitted` | Student | Application enters the admin queue |
| `under_review` | Admin | Admin has started review |
| `offer` | Admin decision | Latest decision is an offer |
| `rejected` | Admin decision | Latest decision is a rejection |

Intended lifecycle:

```text
draft -> submitted -> under_review -> offer | rejected
```

Current enforcement is less strict than the intended lifecycle:

- student rules permit `draft -> draft` or `draft -> submitted`;
- admin rules permit `under_review`, `offer` or `rejected` when the admin is correctly scoped, without checking the previous status;
- `recordDecision()` accepts only `offer` and `rejected`;
- a new decision can reverse a previous decision because each change adds an audit entry;
- neither `submitApplication()` nor the current rules require `documentPath` before submission;
- `recordDecision()` does not currently reject an empty/whitespace message.

## Decision History

Path: `/applications/{applicationId}/decisions/{decisionId}`.

| Field | Type | Required | Meaning |
|---|---|---|---|
| `decision` | string | Yes | `offer` or `rejected` |
| `message` | string | Yes | Admin's custom decision message |
| `decidedBy` | string | Yes | Admin Firebase Auth user ID |
| `decidedAt` | timestamp | Yes | Server timestamp |

`recordDecision()` uses one Firestore batch to update the application and create the history entry. Decision documents are append-only: scoped users can read them, scoped admins can create them, and client update/delete is denied.

## Email Logs

Path: `/emailLogs/{logId}` is reserved for issue #17. No application code currently writes a final log schema.

The email implementation should define at least the application reference, event type, provider, provider message ID, send status and server timestamp. It should avoid storing email bodies, secrets or unnecessary personal data. Final fields and retention remain planned until the server-side Resend route and IS-06 decision are complete.

The current client rule allows any verified user to create an email log. Issue #17 should write logs through a verified server route/Firebase Admin and then deny client creation.

## Composite Indexes

The queries in `lib/db.js` require these collection-scope indexes. They are stored in `firestore.indexes.json` and referenced by `firebase.json`.

| Query | Index fields |
|---|---|
| Student applications ordered newest first | `studentUid ASC`, `createdAt DESC`, `__name__ DESC` |
| Admin university queue ordered by submission | `status ASC`, `universityId ASC`, `submittedAt DESC`, `__name__ DESC` |

Deploy reproducibly with the Firestore configuration rather than relying only on console-created indexes.

## Storage Structure

Object path:

```text
applications/{applicationId}/{timestamp}_{sanitisedFilename}
```

`lib/storage.js` replaces characters outside `a-z`, `A-Z`, `0-9`, `.`, `_` and `-` with `_`.

| Constraint | Implemented rule |
|---|---|
| Maximum size | 10 MB |
| Allowed MIME types | `application/pdf`, `image/jpeg`, `image/png` |
| Write access | Owning student only |
| Read access | Owning student or admin for the application's university |
| Delete access | Denied for Sprint 2 clients |

After upload, the exact Storage path is written to `applications.documentPath`. The code and rules exist, but live Storage evidence is blocked until the team resolves the Firebase Blaze-plan decision.

## Access-Control Summary

| Resource | Student | Admin | Unauthenticated |
|---|---|---|---|
| Own `/users/{uid}` | Read; limited profile update | Read own profile | Denied |
| `/universities` | Read when signed in | Read when signed in | Denied |
| Own application | Verified read/create; allow-listed draft update | Only if it belongs to admin university | Denied |
| Other student's application | Denied | Read/update only for admin university | Denied |
| Decision history | Verified owner read | Scoped read/create | Denied |
| Storage document | Owner read/write within constraints | Scoped read | Denied |
| Email logs | No read; current broad create rule must be tightened | Read; current create rule also permits verified users | Denied |

Firebase Admin operations used by the seed script and future email server route bypass client security rules. Those server paths must perform their own authorization checks.

## Known Gaps and Deferred Decisions

- Storage bucket activation and live upload evidence are blocked by the Blaze-plan decision.
- Required document enforcement before submission is missing.
- Blank decision-message validation is missing in `recordDecision()`.
- Duplicate application prevention is not implemented.
- Final `form` subfields depend on the issue #10 UI/schema agreement.
- Final `emailLogs` fields and retention depend on issue #17 and IS-06.
- GDPR delete/anonymise behaviour and App Check are deferred.
- Automated emulator tests for rules are not yet present.

This document must be updated when issues #10, #11, #14, #15 or #17 change the implemented schema.
