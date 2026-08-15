# Sprint 2 Test Plan

**Issue:** #20 - Create test plan from acceptance criteria

**Version:** 1.0

**Prepared:** 15 July 2026

**Original owner:** Cornel

**Completed by:** Ionut, as Sprint 2 Week 1 catch-up work

> **Execution record:** Results and evidence are recorded in [Issue #25 Test Record](test-record-25.md). This document defines the tests; it does not record outcomes.

## Purpose

This plan turns the Sprint 2 proof-of-concept path into repeatable tests. It covers the complete journey from student registration to an admin decision, decision email and student status update.

Creating this plan does not mean every feature has passed. Each execution must record the exact build, actual result, result status and evidence in the linked Issue #25 test record. Unimplemented or blocked steps must not be reported as passed.

## Scope

The plan covers:

- registration, verification, login, logout and password reset;
- student dashboard status badges;
- application form steps 1 and 4, draft save and submission;
- one PDF, JPG or PNG upload with a 10 MB maximum;
- admin list and detail views;
- university-scoped access control;
- offer/reject decisions, custom messages and audit history;
- decision email, email logging and student status updates;
- loading, validation, failure and unauthorised-access behaviour;
- Vercel preview and production smoke checks.

Implementation and execution status are intentionally omitted from this plan. See the linked Issue #25 test record for current results, blockers and evidence.

## Planned Automated Checks

Run `npm run check` before review. The planned repository checks cover:

- allowed PDF, JPG and PNG uploads at the 10 MB boundary;
- missing, oversized and unsupported upload rejection;
- readable text labels for draft, submitted, under-review, offer and rejected statuses;
- an honest fallback for an unexpected status;
- decision-email content, validation, bearer-token parsing and idempotency;
- the complete Next.js production build.

Automated checks support the acceptance evidence but do not replace live Firebase, Storage, email-delivery or access-control tests.

## Result Values

Use exactly one of these values in the linked execution record:

| Result | Meaning |
|---|---|
| `Pass` | The actual result matches every expected result |
| `Fail` | The feature exists but one or more expected results are wrong |
| `Blocked` | The test cannot run because an external decision, access or dependency is missing |
| `Not implemented` | The required feature is not present on the tested build |
| `Not run` | The test is ready but has not been executed on this build |

## Test Environment and Data

Record this information before each test session:

| Field | Required value |
|---|---|
| Date and tester | Name plus date/time |
| Build | Exact Vercel URL and commit SHA or PR number |
| Browser/device | Browser name/version and desktop/mobile device |
| Firebase project | Project ID only; never credentials |
| Student account | Unique team-controlled test email; never record the password |
| Admin account | Seeded admin email and university; obtain password privately |
| Second university | A university/test application outside the admin's scope |
| Test document | One valid small PDF, JPG or PNG plus invalid-size/type samples |
| Email provider | Provider, verified sender and environment; never record API keys |

Use a normal browser window for the student and a private/incognito window for the admin so one Firebase session does not replace the other.

## Evidence Rules

- Use screenshots or a short recording for visible user journeys.
- Record Firestore document IDs only where needed; hide personal data.
- For security tests, record the attempted action and Firebase error without exposing tokens.
- An HTTP `200` check is not a browser test.
- An email provider `accepted` response is not proof of mailbox delivery.
- Suggested evidence name: `S2-<TEST-ID>-<date>-<short-description>`.

## Traceability

| Area | Issues | Test IDs |
|---|---|---|
| Authentication and student UI | #7, #8 | AUTH-01 to AUTH-10 |
| Student dashboard | #9 | DASH-01 to DASH-03 |
| Application form and upload | #10, #11 | APP-01 to APP-09 |
| Admin list/detail and scoping | #12, #13, #14 | ADM-01 to ADM-06 |
| Decision flow | #15 | DEC-01 to DEC-05 |
| Email system | #16, #17, #18, #19 | EMAIL-01 to EMAIL-06 |
| Integrated release | #21, #25 | E2E-01 to E2E-03, DEP-01 to DEP-03 |

## Authentication Tests

| ID | Type | Preconditions | Exact steps | Expected result |
|---|---|---|---|--- |
| AUTH-01 | Positive | New test email; Firebase configured | Open `/register`; enter valid name, email and password; submit | Loading state appears; Auth account and matching student `/users` profile are created; user reaches verification guidance |
| AUTH-02 | Negative | Existing student email | Register again using the same email | No duplicate account/profile is created; clear existing-account error appears |
| AUTH-03 | Validation | Registration screen | Submit empty fields, invalid email, short password, missing uppercase/number and mismatched confirmation | Each invalid field has clear text; submit is blocked; no account is created |
| AUTH-04 | Access | Registered but unverified student | Log out; log in before verification | User is not allowed into protected application functions and is directed to verification guidance |
| AUTH-05 | Positive/error | Unverified signed-in student | Select resend verification; repeat quickly | First request shows success; throttling/failure shows an honest error and does not claim delivery |
| AUTH-06 | Positive | Verification email received | Open the newest email link; complete verification; return to login; sign in | Link is accepted once; verified login succeeds; protected student actions are available |
| AUTH-07 | Negative | Used, invalid or expired verification code | Open an invalid/used verification URL | Clear invalid/expired message appears; no protected access is granted |
| AUTH-08 | Positive | Existing student account | Open `/reset-password`; request reset; open email link; enter matching valid new password | Request does not reveal account existence; reset link opens the app; password changes successfully |
| AUTH-09 | Negative | Invalid/expired reset code | Open invalid reset URL; attempt weak/mismatched passwords | Invalid code and field errors are clear; password remains unchanged |
| AUTH-10 | Session | Verified student logged in | Log out; refresh protected pages | Session ends; protected data/actions are no longer available |

## Student Dashboard Tests

| ID | Type | Preconditions | Exact steps | Expected result |
|---|---|---|---|--- |
| DASH-01 | Positive | Verified student with no applications | Open dashboard | Empty state and next action are clear; no other student's data appears |
| DASH-02 | Positive | Student applications in each supported status | Open dashboard and compare records | `draft`, `submitted`, `under_review`, `offer` and `rejected` use the correct readable labels/styles |
| DASH-03 | State update | Admin has just decided an application | Refresh or revisit dashboard | New status and latest decision message appear for the correct application |

## Application and Upload Tests

| ID | Type | Preconditions | Exact steps | Expected result |
|---|---|---|---|--- |
| APP-01 | Positive | Verified student; universities seeded | Start application; select university; complete required step 1 and step 4 fields; save | Draft is created for the signed-in student/university; entered data is retained |
| APP-02 | Validation | Application form open | Submit required fields empty or invalid | Field errors appear; no invalid submission is created |
| APP-03 | Positive | Storage enabled; draft exists | Upload a PDF smaller than 10 MB | Upload succeeds under `applications/{applicationId}/...`; `documentPath` updates |
| APP-04 | Positive | Storage enabled; draft exists | Repeat APP-03 with JPG and PNG files | Each allowed type uploads successfully |
| APP-05 | Negative | Draft exists | Select a file larger than 10 MB | Client and Storage rules reject it; application remains usable |
| APP-06 | Negative | Draft exists | Select EXE, DOCX or MIME-spoofed unsupported file | Client and Storage rules reject unsupported content type |
| APP-07 | Positive | Valid draft and required document | Submit the application; refresh dashboard | Status changes from `draft` to `submitted`; submitted timestamp exists; admin queue can include it |
| APP-08 | Access/state | Submitted application | Attempt to change form/document fields or submit again | Firestore rules reject changes outside the allowed transition; stored submission remains unchanged |
| APP-09 | Required document | Draft has no `documentPath` | Attempt to submit the application | Submission is blocked until one valid document is attached; status remains `draft` |

## Admin and Scoping Tests

| ID | Type | Preconditions | Exact steps | Expected result |
|---|---|---|---|--- |
| ADM-01 | Positive | Verified seeded admin; applications at admin university | Log in as admin; open list | Only applications for the admin's university appear, newest submitted first |
| ADM-02 | Security | Application belongs to a different university | Attempt direct detail read and document read using its ID/path | Firestore/Storage deny access; no personal/application data is displayed |
| ADM-03 | Positive | In-scope submitted application | Open application detail | Student/application fields, document reference and decision controls match the selected record |
| ADM-04 | Security | Student account | Attempt to open admin list/detail or call decision action | Access is denied; no admin data or action succeeds |
| ADM-05 | Error | Admin list/detail open | Trigger missing record/network/permission failure | Loading and failure state are clear; previous data is not shown as current success |
| ADM-06 | Isolation | Two admins for different universities, if available | Compare each admin's list against seeded applications | Each admin sees only their own university's records |

## Decision Tests

| ID | Type | Preconditions | Exact steps | Expected result |
|---|---|---|---|--- |
| DEC-01 | Positive | In-scope submitted application | Enter custom message; choose Offer; confirm | Application becomes `offer`; message and timestamp update; one audit record is added atomically |
| DEC-02 | Positive | In-scope submitted application | Enter custom message; choose Reject; confirm | Application becomes `rejected`; message and timestamp update; one audit record is added atomically |
| DEC-03 | Validation | Decision form open | Submit missing/whitespace message or invalid decision value | UI and backend reject a blank message; backend rejects values other than `offer`/`rejected` |
| DEC-04 | Audit | Application has a previous decision | Record another valid decision where policy allows | A new append-only history record is added; previous history is unchanged |
| DEC-05 | Atomic failure | Simulate denied/interrupted write | Attempt decision and inspect application/history | No half-written state: application update and audit record either both exist or neither exists |

## Email Tests

| ID | Type | Preconditions | Exact steps | Expected result |
|---|---|---|---|--- |
| EMAIL-01 | Configuration | Resend domain verified; Vercel variables set | Trigger the controlled issue #17 test route | Email is sent without exposing secrets and a provider message ID is returned |
| EMAIL-02 | Offer | DEC-01 passes | Record an offer; invoke the email route with only the application ID; inspect recipient mailbox and log | Server reads the committed `offer`, message and student email from Firebase; student receives one matching email; log is `sent` |
| EMAIL-03 | Rejection | DEC-02 passes | Record a rejection; invoke the email route with only the application ID; inspect recipient mailbox and log | Server reads the committed `rejected`, message and student email from Firebase; student receives one matching email; log is `sent` |
| EMAIL-04 | Failure | Use controlled invalid provider configuration | Trigger send; inspect admin feedback and `emailLogs` | Decision remains recorded; route returns failure; failed log contains no secret or email body |
| EMAIL-05 | Duplicate prevention | Completed decision email exists | Retry the same request/action | Deterministic log and Resend idempotency key prevent duplicate delivery; response reports `alreadySent` |
| EMAIL-06 | Authorisation | Student or admin from another university has an application ID | Call the decision-email route using that user's Firebase ID token | Server rejects the request; no email is sent and no false success log is created |

## Historical Plan-Review Findings

Implementation gaps identified during Sprint 2 planning are retained in issue #20 and the repository history as contribution context. Their current status and retest evidence belong in the linked Issue #25 test record, not in this test-definition document.

## End-to-End and Deployment Tests

| ID | Type | Preconditions | Exact steps | Expected result |
|---|---|---|---|--- |
| E2E-01 | Offer journey | Integrated preview; student/admin accounts; Storage/email ready | Register; verify; login; create/upload/submit; admin opens scoped record and offers with message; student checks email/dashboard | Every step succeeds on one recorded build; email, status and audit data agree |
| E2E-02 | Rejection journey | Same as E2E-01 with new application | Repeat full journey and reject | Rejection email, status, message and audit data agree |
| E2E-03 | Isolation journey | Two universities and out-of-scope application | Student submits to university B; university A admin attempts list/detail/document access | University A admin cannot discover or access university B application/document |
| DEP-01 | Build | Commit `bf664b3` on `develop` | Inspect Vercel deployment for the merged student-auth build | Deployment reaches `READY` without build errors |
| DEP-02 | Route smoke | A `READY` integrated preview | In a real browser, open `/`, `/register`, `/login`, `/verify-email`, `/reset-password` at desktop/mobile widths; inspect console | Routes render without 404/overlap; no unexpected console errors |
| DEP-03 | Production release | Release PR from `develop` to `main` | Review PR/checks; merge only after Must tests; run smoke path on production URL | Production points to approved commit and critical path still passes |

## Feature-Owner Review Responsibilities

The reviewers below were identified when issue #20 was completed. This preserves the original ownership and catch-up contribution record; confirmations and current outcomes belong in the linked execution record.

| Area | Reviewer |
|---|---|
| Firebase/auth/security | Dawid |
| Student screens/dashboard/form/upload | Alina |
| Admin/scoping/decisions | Ionut |
| Email | Ionut as fallback for Sorin |
| Test coverage | Ionut as fallback for Cornel |

## Execution Records

Record every meaningful integrated-build execution in [Issue #25 Test Record](test-record-25.md). Do not add outcomes to this plan or overwrite earlier evidence.

## Exit Criteria

Sprint 2 is ready for final demonstration only when:

- all Must tests are `Pass`, or an accepted blocker is clearly recorded;
- the complete offer or rejection journey passes on one integrated build;
- university isolation passes;
- Storage and email evidence uses the real configured services;
- critical failures have been fixed and retested;
- the tested commit is merged to `main` and production is smoke-tested;
- the Sprint 2 report contains the test summary and evidence links.
