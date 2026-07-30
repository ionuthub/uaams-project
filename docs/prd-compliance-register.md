# PRD Compliance Register and Corrective Action Plan

## 1. Purpose

This register compares the original 13-page **Project Requirements Document - University Administration & Application Management System** with the implemented repository and Product Backlog.

It prevents a reduced sprint increment from silently replacing the agreed product scope. A requirement may be deferred to a later sprint, but it remains required unless the client or supervisor approves a documented change.

## 2. Source and authority

- **Baseline source:** `PRD-University Administration Application Management System.pdf`
- **Product scope authority:** the PRD plus subsequently approved change decisions
- **Sprint scope authority:** selected user stories and issues
- **Implementation truth:** merged repository code, deployed configuration and recorded test evidence

The PRD defines the product target. A sprint selects a smaller increment of that target; it does not remove unselected PRD requirements.

## 3. Status vocabulary

| Status | Meaning |
|---|---|
| Aligned | Implemented or designed consistently with the PRD; final evidence may still be required. |
| Partial | Some of the requirement exists, but mandatory behaviour or evidence is missing. |
| Missing | No adequate implementation or committed delivery item exists. |
| Substituted | The business outcome is retained through a different approved or approval-pending technical method. |
| Deferred | Still a mandatory PRD requirement, intentionally scheduled after the current increment. |
| Out of scope | The PRD explicitly excludes the feature. It needs formal change approval before implementation. |
| Proposed addition | Not required by the PRD and not authorised merely because it appears in an evolved ERD. |

## 4. PRD compliance matrix

### 4.1 Product, technology and roles

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-OV-01 | Manage the end-to-end university application process and centralise applications, documents, decisions and communication. | The minimum journey is designed, but the complete student-to-decision path is not integrated. | Partial | Complete and browser-test the end-to-end journey in issue #25. | Whole team; Ionut coordinates | Exact deployed build, end-to-end record and report reference |
| PRD-TECH-01 | React.js and Next.js frontend. | Next.js 15 and React 19 are used. | Aligned | Maintain supported versions and production build checks. | Frontend owners | `package.json`, successful build |
| PRD-TECH-02 | Firebase Authentication, Firestore and Storage. | Auth and Firestore foundations exist; Storage live evidence remains incomplete. | Partial | Complete Storage #6 and integrated upload #11. | Dawid; UI owner supports | Firebase screenshots, rules, upload tests, merged PR |
| PRD-TECH-03 | Transactional email through SMTP provider. | Resend HTTPS API is used instead of direct SMTP. | Substituted | Record an architectural decision and obtain approval that Resend API satisfies the SMTP business outcome. | Email owner; Dawid reviews | Decision record, provider evidence, approval comment |
| PRD-TECH-04 | Vercel plus Firebase hosting/environment integration. | Vercel preview/production exists. Firebase environment separation needs clarification. | Partial | Document whether development and production share Firebase; create the approved separation plan. | Ionut and Dawid | Configuration guide with redacted evidence |
| PRD-ROLE-01 | Student role. | Implemented as `student`. | Aligned | Retain controlled self-registration. | Dawid and Alina | Profile and access tests |
| PRD-ROLE-02 | University Admin role. | Implemented as `admin`, scoped by `universityId`. | Aligned with naming variation | Document `admin = university_admin` or rename consistently before handover. | Dawid and Silvana | Schema/rules documentation and role tests |
| PRD-ROLE-03 | No Super Admin; university admins are pre-created/seeded. | No Super Admin exists; seed approach exists. | Aligned | Preserve this boundary unless a formal change is approved. | Dawid | Seed evidence and negative role test |

### 4.2 Authentication and student portal

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-AUTH-01 | Email/password authentication using Firebase Auth. | Shared Firebase Auth functions and screens exist. | Aligned | Complete deployed positive/negative tests. | Dawid and Alina | AUTH test results and screenshots |
| PRD-AUTH-02 | Role-based access for Student and University Admin. | Rules and profile roles exist; full cross-role evidence remains. | Partial | Execute applicant/admin and cross-university denial tests. | Dawid; test owner verifies | Rules tests and browser evidence |
| PRD-AUTH-03 | Email verification at registration. | Verification flow exists. | Partial | Prove registration-to-verification on the integrated deployment, including invalid/expired actions. | Dawid and Alina | Received email and AUTH-05-AUTH-07 |
| PRD-AUTH-04 | Password reset by email. | Reset request/action screens and functions exist. | Partial | Test successful, invalid and expired reset actions. | Dawid and Alina | AUTH-08-AUTH-09 evidence |
| PRD-AUTH-05 | Next.js route protection. | Firebase/rules protection exists; a complete protected-route policy is not proven for every route. | Partial | Define the protected-route map and test signed-out, wrong-role and unverified access. | Dawid and route owners | Route matrix and access tests |
| PRD-REG-01 | Registration captures full name, email and password. | Implemented. | Aligned | Retain validation and accessibility evidence. | Alina | Registration tests |
| PRD-REG-02 | Registration captures nationality. | Registration UI, profile write and Firestore allow-list now include nationality. | Partial | Execute and record a live persistence test. | Ionut and Dawid | Schema PR, field screenshot and stored-record test |
| PRD-REG-03 | Registration captures intended study level: Bachelor/Master/PhD. | Removed because the value was discarded. | Missing | Add controlled values to approved schema/rules and restore the field. | Silvana, Dawid and Alina | Validation and persistence evidence |
| PRD-REG-04 | Registration records privacy-policy acceptance. | Accessible consent, `/privacy` notice and server-timestamped consent record are implemented. | Partial | Obtain stakeholder wording approval and record a live persistence test. | Ionut coordinates; Silvana/Dawid review | Policy page, consent record and test |
| PRD-DASH-01 | Student views all owned applications. | Query helper exists; finished dashboard remains active work. | Partial | Complete dashboard UI and ownership tests. | Alina and Dawid | Merged PR, preview and DASH tests |
| PRD-DASH-02 | Show Draft, Submitted, Under Review, Offered and Rejected. | Lifecycle exists; stored value is `offer` rather than `offered`. | Partial | Document/standardise stored values and displayed labels; test all states. | Dawid and Alina | Schema mapping and status screenshots |
| PRD-DASH-03 | Show university responses. | `latestDecisionMessage` supports the outcome; finished display is pending. | Partial | Display the trusted response and approved history. | Alina with Ionut/Dawid | Dashboard response test |
| PRD-DASH-04 | Receive system notifications. | Email exists; in-app notification centre was moved to a proposed later story. | Deferred mandatory requirement | Confirm email-only versus in-app meaning. Unless waived, promote US-17/FR-19 to required scope. | Ionut and Silvana | Client decision; notification tests if retained |

### 4.3 Application and documents

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-APP-01 | Personal data: full name, date of birth, nationality and passport number. | Generic `form` map exists; mandatory fields are not defined or enforced. | Missing | Define typed fields, validation, rules and UI; minimise and protect personal data. | Silvana, Dawid and Alina | Schema, validation and persistence tests |
| PRD-APP-02 | Academic data: qualification, institution, graduation year and GPA/grade. | Generic `form` map exists; required fields are not enforced. | Missing | Define approved field types/ranges, UI and rules. | Silvana, Dawid and Alina | Application tests and stored record |
| PRD-APP-03 | Course data: university, course name and intended intake. | University helper exists; course/intake were labelled proposed Sprint 3. | Deferred mandatory requirement | Promote course/intake to required backlog unless removal is approved; resolve model and duplicate rules. | Ionut/Silvana; Dawid/Alina implement | Client decision, schema and selection tests |
| PRD-APP-04 | Valid application can be submitted and managed. | Create/submit helpers exist; finished UI and required-field gate are incomplete. | Partial | Complete form, draft management and mandatory-field submission validation. | Alina and Dawid | APP-01/02/07/08 results |
| PRD-DOC-01 | Upload passport copy, transcripts, certificates and optional English test. | Typed metadata and upload controls exist for all four types; passport copy, transcripts and certificates are required, while the English test is optional. | Aligned | Maintain the type list and required/optional rule together across UI, service and documentation changes. | Dawid and Alina; Silvana documents/tests | Issue #25 multi-document production test; architecture and schema documentation |
| PRD-DOC-02 | Documents stored in Firebase Storage and metadata in Firestore. | Objects are stored below the application Storage path; Firestore stores `path`, `name` and `uploadedAt` in the application's `documents` map. | Aligned | Preserve owner/scoped-admin access and keep the legacy `documentPath` migration explicit. | Dawid; Silvana documents/tests | Issue #25 upload/admin-view evidence; `docs/schema-documentation.md` |
| PRD-DOC-03 | File size and format validation. | Client validation and Storage rules enforce PDF/JPG/PNG and a 10 MB maximum; invalid type and oversized-file production tests passed. | Aligned | Repeat the negative tests after upload-policy or Storage-rule changes. | Dawid and test owner | Issue #25 invalid-type and oversized-file evidence |
| PRD-DOC-04 | Required evidence gates submission. | The UI, `submitApplication()` and Firestore rules require paths for passport copy, transcripts and certificates; the English test remains optional. | Aligned | Keep all three enforcement layers consistent and repeat the missing-document test after rule changes. | Ionut and Dawid; Silvana tests | Issue #25 missing-required-document evidence; `DOCUMENTS_REQUIRED` service/rule review |

### 4.4 University administration and decisions

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-ADM-01 | View all applications assigned to the admin's university. | Backend query exists; PR #63 adds the first UI. | Partial | Obtain scoping review, populated-list evidence and merge PR #63. | Ionut and Dawid | Merged PR, scoped screenshot and denial test |
| PRD-ADM-02 | Filter applications by status. | No interactive filter UI. | Missing | Add accessible status filtering and tests. | Ionut | Filter screenshots/tests |
| PRD-ADM-03 | Search by student name or application ID. | Not implemented. | Missing | Add scoped, indexed search appropriate to Firestore. | Ionut and Dawid | Search tests and query/index evidence |
| PRD-ADM-04 | Show application counts per status. | Not implemented. | Missing | Add counts without unsafe/unbounded reads; test scope. | Ionut and Dawid | Count comparison and scope test |
| PRD-ADM-05 | View full student profile. | Detail helper exists; full detail UI/profile join is incomplete. | Partial | Complete #13 with minimum necessary personal data. | Ionut and Dawid | Detail screenshot and access tests |
| PRD-ADM-06 | Download uploaded documents securely. | Signed download helper exists; full UI/evidence is incomplete. | Partial | Add authorised document access and cross-university denial tests. | Ionut and Dawid | Download and denial evidence |
| PRD-ADM-07 | Add internal notes. | Not implemented or modelled. | Missing | Define ownership, visibility, audit and retention; implement after approval. | Silvana and Dawid; Ionut UI | Schema, rules and note tests |
| PRD-ADM-08 | Change status to Under Review, Offered or Rejected. | Status model exists; finished UI and transition evidence are incomplete. | Partial | Implement and test the allowed transition policy. | Ionut and Dawid | DEC and admin tests |
| PRD-DEC-01 | Admin selects offer/rejection and adds a custom message. | Backend function exists; finished UI remains #15. | Partial | Complete decision UI and require a non-blank message if retained. | Ionut | Decision screenshots/tests |
| PRD-DEC-02 | Decision saved in Firestore and history logged. | Atomic update plus append-only subcollection exists. | Aligned | Obtain live positive/denied evidence. | Dawid and Ionut | DEC-01-DEC-05 |
| PRD-DEC-03 | Automated decision email sent to student. | Draft PR #65 has protected endpoint; UI trigger/live integration are pending. | Partial | Configure Firebase Admin privately, deploy reviewed rules, connect #15 and test outcomes. | Ionut/email owner; Dawid reviews | Offer/rejection delivery and log evidence |

### 4.5 Email and data structure

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-EMAIL-01 | Registration confirmation email. | Verification exists; distinct registration confirmation is absent. | Missing/needs clarification | Confirm whether verification fulfils both events; otherwise add a separate template/trigger. | Ionut and Dawid | Client decision and received email |
| PRD-EMAIL-02 | Email verification. | Firebase Auth owns this event. | Partial | Complete integrated delivery/action tests. | Dawid and Alina | AUTH email evidence |
| PRD-EMAIL-03 | Application submission confirmation. | Not implemented. | Missing | Add trusted post-submission trigger, template and log behaviour. | Email owner and Dawid | Received email and log |
| PRD-EMAIL-04 | Application status-update email. | Decision email is planned; general status update is absent. | Missing/partial | Define which transitions send messages and prevent duplicates. | Ionut, email owner and Dawid | Transition matrix and delivery tests |
| PRD-EMAIL-05 | Offer and rejection notifications. | Draft PR #65 exists; integration evidence is pending. | Partial | Complete security review, #15 trigger and end-to-end tests. | Ionut and Dawid | EMAIL tests, provider IDs and screenshots |
| PRD-EMAIL-06 | HTML templates, environment-held credentials, email logs and failed-delivery handling. | Environment/Resend foundation exists; draft PR #65 adds remaining controls. | Partial | Merge only after security review and live success/failure/duplicate tests. | Dawid reviews; Ionut coordinates | PR, tests and redacted logs |
| PRD-DATA-01 | `users` with role, profile data and timestamps. | Implemented with reduced profile. | Partial | Add approved PRD profile fields and privacy controls. | Dawid and Silvana | Schema and profile tests |
| PRD-DATA-02 | `universities` with name and `adminUserIds`. | University reference exists; admins instead carry `universityId`. | Substituted design | Record why the user-side foreign key replaces `adminUserIds`; test multi-admin/isolation. | Dawid and Silvana | Decision and rules tests |
| PRD-DATA-03 | `applications` with student, university, course, status and timestamps. | Course is missing. | Partial | Add approved course/intake model. | Dawid and Alina | Schema and application test |
| PRD-DATA-04 | `documents` with application, file type, URL/path and timestamp. | An embedded `applications.documents` map records typed entries with `path`, `name` and `uploadedAt`; no top-level collection is used. | Substituted | Confirm the embedded map as the accepted equivalent model and retire legacy `documentPath` when compatibility is no longer required. | Dawid and Silvana | `docs/schema-documentation.md`, issue #25 document tests and model review |
| PRD-DATA-05 | `notifications` with user, message, read state and timestamp. | Not implemented; proposed US-17 only. | Deferred mandatory requirement | Confirm scope and promote unless waived. | Ionut and Silvana | Approval decision or notification tests |

### 4.6 Non-functional, UX, testing and delivery

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-NFR-01 | Optimised Firestore queries. | Scoped queries/indexes are designed; evidence is incomplete. | Partial | Review query plans/indexes and avoid unbounded reads. | Dawid | Index export and query tests |
| PRD-NFR-02 | Pagination for application lists. | Not implemented. | Missing | Implement cursor-based pagination for student/admin lists. | Dawid and UI owners | Pagination tests |
| PRD-NFR-03 | Lazy loading where applicable. | Not explicitly designed/evidenced. | Missing/evidence gap | Identify large routes/assets and document loading strategy. | Frontend owners | Build analysis and browser evidence |
| PRD-NFR-04 | Security rules, role access, secure documents and no frontend credentials. | Rules and secret controls exist; live denial evidence is incomplete. | Partial | Complete allowed/denied tests and reviewed rule deployment. | Dawid | Rules tests, deployment evidence and secret scan |
| PRD-NFR-05 | Multiple universities. | Model supports scoping; limited seeded evidence. | Partial | Seed a second university/admin and prove isolation. | Dawid and test owner | Cross-university test |
| PRD-NFR-06 | Handle thousands of concurrent users. | Not demonstrated. | Missing/evidence gap | Define measurable capacity target and run approved non-destructive performance testing. | Dawid and Ionut | Results and limitations |
| PRD-NFR-07 | Modular and maintainable architecture. | Shared services and documentation exist. | Aligned/ongoing | Maintain boundaries, checks and documentation. | Whole team | Code review and build checks |
| PRD-NFR-08 | GDPR-compliant storage and deletion on request. | Deletion/anonymisation deferred; client deletion denied. | Missing | Define retention, export/delete/anonymise behaviour, implement and test a deletion request. | Ionut/Silvana; Dawid implements | Policy and deletion test |
| PRD-UX-01 | Clean responsive academic UI. | Auth screens exist; full portal/admin evidence pending. | Partial | Finish screens and capture mobile/tablet/desktop evidence. | Alina and Ionut | Browser screenshots |
| PRD-UX-02 | Clear status indicators. | Model exists; dashboard incomplete. | Partial | Show text-labelled accessible statuses. | Alina | Accessibility/status evidence |
| PRD-UX-03 | Confirmation dialogs for critical actions. | Not consistently implemented. | Missing | Define critical actions and add accessible confirmations. | UI owners | Interaction tests |
| PRD-UX-04 | Accessible forms and error messages. | Auth components address this; full coverage incomplete. | Partial | Run keyboard, label, error association and contrast checks. | UI owners/test owner | Accessibility checklist |
| PRD-ERR-01 | Friendly errors and graceful network handling. | Some controlled states exist; full journey incomplete. | Partial | Test loading, empty, denied, timeout/offline and retry states. | Feature owners | Negative-path browser tests |
| PRD-ERR-02 | Log auth failures, permission violations and email errors. | Email logging is draft work; privacy-safe logging policy incomplete. | Partial | Define allowed fields/retention and implement server-side logging. | Dawid and Silvana | Redacted log samples |
| PRD-TEST-01 | Unit tests for core logic. | Decision-email tests exist only on draft PR #65; other coverage is limited. | Partial | Add focused validation, lifecycle and authorisation tests. | Feature owners | CI output |
| PRD-TEST-02 | Integration testing for authentication/application flow. | The integrated applicant, admin review, document, decision, notification and email path was executed on production build `1b50522`. | Aligned | Repeat the smoke/demo path on meaningful integrated builds and record any regression. | Test and feature owners | Issue #25 pass/fail record, screenshots and `UAAMS_Test_Record_Week4.docx` |
| PRD-TEST-03 | Manual UAT. | Planned but not completed. | Missing | Use representative users, approved scenarios and consent-safe findings. | Silvana/test owner | UAT protocol/findings |
| PRD-TEST-04 | Email delivery testing. | Resend connection passed; final event set incomplete. | Partial | Test each retained event, failure and duplicate behaviour. | Email/test owners | Received emails and logs |
| PRD-DEP-01 | Development and production environments. | Vercel previews/production exist; Firebase separation unclear. | Partial | Document and approve separation and test-data policy. | Ionut and Dawid | Environment matrix |
| PRD-DEP-02 | Next.js on Vercel, Firebase per environment and secure variables. | Vercel/secure variables exist; Firebase separation needs evidence. | Partial | Complete configuration guide without secret values. | Ionut and Dawid | Guide and redacted screenshots |
| PRD-DEL-01 | Functional app, student submission portal and admin dashboard. | Incremental implementation only. | Partial | Complete all retained acceptance paths before final-delivery claim. | Whole team | Production/UAT evidence |
| PRD-DEL-02 | Architecture, schema, rules, API/service, environment and deployment documentation. | Architecture and schema documentation now describe the typed-document model, required-document rule, Storage policy and production evidence; wider handover documentation remains ongoing. | Partial | Complete remaining API/config/deployment and handover coverage and maintain this register after implementation changes. | Silvana, Dawid and Ionut | Issue #69 documentation PR and merged documentation reviews |
| PRD-DEL-03 | Repository, README, initial admins, optional test data and support notes. | Repository/README/seed exist; final support/handover incomplete. | Partial | Prepare final seed, test-data, support and handover material. | Ionut and Dawid | Handover pack |

### 4.7 Scope control

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-SCOPE-01 | Payment processing is out of scope. | Payment appears as a proposed Sprint 3 Epic/story. | Out of scope | Do not implement payment-provider work without an approved change request. | Product coordination | Approved change if scope changes |
| PRD-SCOPE-02 | Agent/counsellor roles are out of scope. | No implementation. | Aligned | Keep out of scope unless approved. | Whole team | Backlog/repository review |
| PRD-SCOPE-03 | AI screening is out of scope. | No implementation. | Aligned | Keep out of scope. | Whole team | Repository review |
| PRD-SCOPE-04 | Multi-language support is out of scope. | No implementation. | Aligned | Keep out of scope. | Whole team | Repository review |
| PRD-SCOPE-05 | Compliance officer, finance checks, conditional offers and additional-document request workflows are unapproved additions. | They appear as evolved-ERD proposals. | Proposed addition | Require client/supervisor approval before scheduling or implementation. | Ionut and Silvana | Change decision and revised PRD/SRS |

## 5. Corrective implementation order

### P0 - Restore control of the agreed scope

1. Obtain decisions for Resend API substitution, one-document interim scope, notification interpretation and Firebase environment separation.
2. Keep payments, finance/compliance and other additions out of implementation until approved.
3. Add PRD references to every affected story/task. Do not close a PRD requirement merely because a smaller sprint issue is Done.

### P1 - Complete the core end-to-end journey

1. Finish Storage and secure upload evidence.
2. Complete required application fields and the submission gate.
3. Complete university-scoped admin list/detail/document access.
4. Complete decision UI, protected decision email and email logs.
5. Complete dashboard status/response display.
6. Execute the complete path on an exact deployment.

### P2 - Restore mandatory breadth omitted by the minimum increment

1. Nationality, intended study level and privacy-policy consent.
2. Date of birth, passport and academic information.
3. Course and intake.
4. Typed multi-document model.
5. Admin filtering, search, counts and internal notes.
6. Submission/status emails and retained system notifications.
7. Pagination, GDPR deletion and performance evidence.

### P3 - Complete handover quality

1. UAT and accessibility evidence.
2. Environment, API/service, rules and deployment guides.
3. Seed/test-data and post-deployment support notes.
4. Final bidirectional traceability from PRD to deployed evidence and back.

## 6. PRD change-control rule

Any proposed removal, substitution or addition must record:

- affected PRD ID(s);
- requested change and reason;
- impact on stories, schema, security, tests, schedule and report;
- decision owner;
- approval date and evidence;
- replacement acceptance criteria, if applicable.

Until approval is recorded, the original PRD requirement remains authoritative.

## 7. Definition of PRD-compliant Done

A PRD requirement is complete only when:

- the requirement or approved replacement is implemented;
- required security and negative cases pass;
- the relevant PR is merged;
- an exact deployed build is identified where applicable;
- test and screenshot/demo evidence are recorded;
- documentation and the shared report match reality;
- this register links to the evidence;
- an approved variation is linked where the original wording changed.
