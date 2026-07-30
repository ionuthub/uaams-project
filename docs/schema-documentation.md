# Schema Documentation

**Issues:** #23 - Draft schema documentation; #69 - Document model and required-document rule

**Owners:** Silvana and Dawid

**Implementation review:** Updated against `develop` commit `03f9490` on 30 July 2026, including `app/apply/page.js`, `lib/db.js`, `lib/storage.js`, `lib/upload-policy.mjs`, `firestore.rules` and `storage.rules`.

## Purpose

This document records the Firestore and Storage structures currently implemented by UAAMS. Planned or deferred structures are labelled clearly.

## Implemented Firestore Structure

```text
/users/{uid}
/universities/{universityId}
/applications/{applicationId}
/applications/{applicationId}/decisions/{decisionId}

/emailLogs/{logId}
```

There is no top-level `documents` collection. Typed document metadata is embedded in the parent application under `applications.documents`; the Storage objects remain below the application's Storage path. `applications.documentPath` is retained as a legacy compatibility field containing the most recently uploaded path. The latest student-facing message is stored in `applications.latestDecisionMessage`, and full decision history is stored below each application.

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
| `documents` | map | Yes | Typed document metadata; starts as an empty map |
| `documentPath` | string or null | Yes (legacy compatibility) | Most recently uploaded Firebase Storage object path; starts as `null` |
| `createdAt` | timestamp | Yes | Server timestamp when the draft is created |
| `updatedAt` | timestamp | Yes | Server timestamp for the latest allowed change |
| `submittedAt` | timestamp | Required after submission | Added when status becomes `submitted` |
| `latestDecisionMessage` | string | Required after decision | Latest admin message shown to the student |

The application page uses `findDraftApplication()` to reuse an existing draft for the same student and university when one is available.

### Embedded document metadata

Path: `/applications/{applicationId}` field `documents`.

| Map key | Required for submission | Value |
|---|---|---|
| `passportCopy` | Yes | `{ path: string, name: string, uploadedAt: timestamp }` |
| `transcripts` | Yes | `{ path: string, name: string, uploadedAt: timestamp }` |
| `certificates` | Yes | `{ path: string, name: string, uploadedAt: timestamp }` |
| `englishTest` | No | `{ path: string, name: string, uploadedAt: timestamp }` |

`uploadTypedDocument()` validates the key against `DOC_TYPES`, sanitises the original filename, uploads the object and updates the corresponding nested map entry. It also updates `documentPath` with the newest path so existing records and views remain compatible.

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
- the page, `submitApplication()` and Firestore rules require non-empty paths for `documents.passportCopy`, `documents.transcripts` and `documents.certificates` before submission;
- `documents.englishTest` is optional and does not block submission;
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

Path: `/emailLogs/{logId}`. Decision emails use the deterministic ID `decision-{applicationId}-{decisionId}`, so retrying the same decision updates one log instead of creating duplicates.

| Field | Type | Required | Meaning |
|---|---|---|---|
| `eventType` | string | Yes | `decision` |
| `provider` | string | Yes | `resend` |
| `applicationId` | string | Yes | Related application |
| `decisionId` | string | Yes | Related append-only decision record |
| `decision` | string | Yes | `offer` or `rejected` |
| `studentUid` | string | Yes | Student account reference; no email address is stored in the log |
| `universityId` | string | Yes | Scope used for admin log reads |
| `requestedBy` | string | Yes | Admin Firebase user ID |
| `status` | string | Yes | `sending`, `sent` or `failed` |
| `attempts` | number | Yes | Number of claimed send attempts |
| `providerMessageId` | string | After success | Resend message ID |
| `lastErrorCode`, `providerStatus` | string/number or null | After attempt | Limited failure evidence without provider payload or secrets |
| `createdAt`, `startedAt`, `updatedAt` | timestamp | Yes | Server-side lifecycle timestamps |
| `sentAt`, `failedAt` | timestamp | When applicable | Latest outcome timestamp |

The protected route writes logs with Firebase Admin after verifying the caller and application scope. Firestore client writes are denied. Admin reads are limited to logs with the same `universityId` as the admin profile. Email addresses, bodies, API keys and private keys are not stored.

## Composite Indexes

The queries in `lib/db.js` require these collection-scope indexes. They are stored in `firestore.indexes.json` and referenced by `firebase.json`.

| Query | Index fields |
|---|---|
| Student applications ordered newest first | `studentUid ASC`, `createdAt DESC`, `__name__ DESC` |
| Admin university queue ordered by submission | `status ASC`, `universityId ASC`, `submittedAt DESC`, `__name__ DESC` |

Deploy reproducibly with the Firestore configuration rather than relying only on console-created indexes.

## Storage Structure

Typed-document object path:

```text
applications/{applicationId}/{docType}__{timestamp}_{sanitisedFilename}
```

`lib/storage.js` replaces characters outside `a-z`, `A-Z`, `0-9`, `.`, `_` and `-` with `_`.

| Constraint | Implemented rule |
|---|---|
| Maximum size | 10 MB |
| Allowed types | PDF, JPG/JPEG or PNG; the client accepts recognised MIME types or extensions, while Storage rules enforce the uploaded MIME type |
| Write access | Verified owning student only |
| Read access | Verified owning student or verified admin for the application's university |
| Delete access | Denied for Sprint 2 clients |

After upload, the exact Storage path, sanitised name and server upload timestamp are written to `applications.documents.{docType}`. The path is also written to legacy `applications.documentPath`.

The required-document rule is enforced independently in the service and security boundary:

- `submitApplication()` reads the current application and throws `DOCUMENTS_REQUIRED` if any mandatory entry has no `path`;
- Firestore permits `draft -> submitted` only when all three mandatory paths are strings;
- the application page blocks submission and lists the missing labels;
- direct attempts to bypass the page remain subject to Firestore rules.

Production evidence recorded in issue #25 on 30 July 2026 confirms successful upload of all three required types, blocked submission with a missing required type, rejection of an unsupported type and rejection of a file larger than 10 MB.

## Access-Control Summary

| Resource | Student | Admin | Unauthenticated |
|---|---|---|---|
| Own `/users/{uid}` | Read; limited profile update | Read own profile | Denied |
| `/universities` | Read when signed in | Read when signed in | Denied |
| Own application | Verified read/create; allow-listed draft update | Only if it belongs to admin university | Denied |
| Other student's application | Denied | Read/update only for admin university | Denied |
| Decision history | Verified owner read | Scoped read/create | Denied |
| Storage document | Owner read/write within constraints | Scoped read | Denied |
| Email logs | No access | Read for own university; no client writes | Denied |

Firebase Admin operations used by the seed script and decision-email server route bypass client security rules. Those server paths must perform their own authorization checks.

## Known Gaps and Deferred Decisions

- Blank decision-message validation is missing in `recordDecision()`.
- A top-level `documents` collection is not implemented; the approved current model embeds typed metadata in each application.
- Legacy `documentPath` remains during compatibility migration and should not be treated as the required-document source of truth.
- Email-log retention still depends on IS-06.
- GDPR delete/anonymise behaviour and App Check are deferred.
- Automated emulator tests for rules are not yet present.

This document must be updated when issues #10, #11, #14, #15, #19 or #69 change the implemented schema.
