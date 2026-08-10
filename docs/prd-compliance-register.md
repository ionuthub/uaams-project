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
| PRD-OV-01 | Manage the end-to-end university application process and centralise applications, documents, decisions and communication. | The integrated student-to-decision journey is implemented and passed on production build `1b50522`. | Aligned | Repeat the end-to-end path after meaningful integrated changes. | Whole team; Ionut coordinates | Issue #25 pass/fail record, screenshots and report reference |
| PRD-TECH-01 | React.js and Next.js frontend. | Next.js 15 and React 19 are used. | Aligned | Maintain supported versions and production build checks. | Frontend owners | `package.json`, successful build |
| PRD-TECH-02 | Firebase Authentication, Firestore and Storage. | Authentication, Firestore and Storage are integrated; required document upload and authorised viewing passed on production. | Aligned | Repeat security and upload checks after Firebase configuration or rule changes. | Dawid; UI owner supports | Issues #21/#25, rules, upload tests and production screenshots |
| PRD-TECH-03 | Transactional email through SMTP provider. | Resend HTTPS API is used instead of direct SMTP. | Substituted | Record an architectural decision and obtain approval that Resend API satisfies the SMTP business outcome. | Email owner; Dawid reviews | Decision record, provider evidence, approval comment |
| PRD-TECH-04 | Vercel plus Firebase hosting/environment integration. | Vercel preview/production exists. Firebase environment separation needs clarification. | Partial | Document whether development and production share Firebase; create the approved separation plan. | Ionut and Dawid | Configuration guide with redacted evidence |
| PRD-ROLE-01 | Student role. | Implemented as `student`. | Aligned | Retain controlled self-registration. | Dawid and Alina | Profile and access tests |
| PRD-ROLE-02 | University Admin role. | Implemented as `admin`, scoped by `universityId`. | Aligned with naming variation | Document `admin = university_admin` or rename consistently before handover. | Dawid and Silvana | Schema/rules documentation and role tests |
| PRD-ROLE-03 | No Super Admin; university admins are pre-created/seeded. | No Super Admin exists; seed approach exists. | Aligned | Preserve this boundary unless a formal change is approved. | Dawid | Seed evidence and negative role test |

### 4.2 Authentication and student portal

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-AUTH-01 | Email/password authentication using Firebase Auth. | Shared Firebase Auth functions and screens are implemented and the deployed sign-in journey passed. | Aligned | Repeat positive and negative authentication checks after auth changes. | Dawid and Alina | Issues #21/#25 authentication results and screenshots |
| PRD-AUTH-02 | Role-based access for Student and University Admin. | Rules and profile roles exist; full cross-role evidence remains. | Partial | Execute applicant/admin and cross-university denial tests. | Dawid; test owner verifies | Rules tests and browser evidence |
| PRD-AUTH-03 | Email verification at registration. | Registration-to-verification and the unverified-user application guard passed on production. | Aligned | Add repeat evidence for invalid and expired action links after authentication changes. | Dawid and Alina | Issue #25 received-email, verified-state and access-guard evidence |
| PRD-AUTH-04 | Password reset by email. | Reset request/action screens and functions exist. | Partial | Test successful, invalid and expired reset actions. | Dawid and Alina | AUTH-08-AUTH-09 evidence |
| PRD-AUTH-05 | Next.js route protection. | Firebase/rules protection exists; a complete protected-route policy is not proven for every route. | Partial | Define the protected-route map and test signed-out, wrong-role and unverified access. | Dawid and route owners | Route matrix and access tests |
| PRD-REG-01 | Registration captures full name, email and password. | Implemented. | Aligned | Retain validation and accessibility evidence. | Alina | Registration tests |
| PRD-REG-02 | Registration captures nationality. | Registration UI, profile write and Firestore allow-list require and persist `nationality`. | Aligned | Retain field validation and persistence coverage. | Ionut and Dawid | `lib/auth.js`, `firestore.rules`, schema documentation and registration evidence |
| PRD-REG-03 | Registration captures intended study level: Bachelor/Master/PhD. | Registration captures a controlled `studyLevel` value and stores it in the user profile. | Aligned | Keep UI choices, rules and schema documentation synchronized. | Silvana, Dawid and Alina | `lib/auth.js`, `firestore.rules` and schema documentation |
| PRD-REG-04 | Registration records privacy-policy acceptance. | Accessible consent, `/privacy` notice and server-timestamped `privacyConsentAt` are implemented. | Aligned | Retain the consent gate and review wording when the privacy notice changes. | Ionut coordinates; Silvana/Dawid review | Registration evidence, consent record, privacy notice and schema documentation |
| PRD-DASH-01 | Student views all owned applications. | The student dashboard lists the signed-in student's applications and links to read-only submitted details. | Aligned | Repeat ownership and empty-state checks after dashboard/query changes. | Alina and Dawid | Issue #25 dashboard/application-view evidence and Firestore ownership rules |
| PRD-DASH-02 | Show Draft, Submitted, Under Review, Offered and Rejected. | All lifecycle states are mapped to clear display labels; stored `offer` is documented as the displayed "Offer made" outcome. | Aligned | Keep stored values and display labels documented together. | Dawid and Alina | Status mapping tests and issue #25 screenshots |
| PRD-DASH-03 | Show university responses. | The latest decision message and outcome are displayed on the dashboard and application detail view. | Aligned | Repeat offer/rejection display checks after decision changes. | Alina with Ionut/Dawid | Issue #25 offer/rejection status and message evidence |
| PRD-DASH-04 | Receive system notifications. | The student dashboard includes an in-app notification centre for submission, under-review and decision events, with read/unread state and corresponding emails. | Aligned | Repeat notification display, ownership and mark-as-read tests after material changes. | Ionut and Silvana | Issues #21/#25 notification-centre screenshots and email evidence |

### 4.3 Application and documents

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-APP-01 | Personal data: full name, date of birth, nationality and passport number. | The application form requires these fields and applies field-specific format, age and passport validation. | Aligned | Maintain data minimisation, validation and access controls. | Silvana, Dawid and Alina | Issue #25, `app/apply/page.js`, admin/student detail views and rules |
| PRD-APP-02 | Academic data: qualification, institution, graduation year and GPA/grade. | The application form requires and validates qualification, institution, graduation year and grade data. | Aligned | Keep validation and display coverage synchronized with the schema. | Silvana, Dawid and Alina | Issue #25 and application/admin detail evidence |
| PRD-APP-03 | Course data: university, course name and intended intake. | University, course name and intake are required application fields and are shown in student/admin detail views. | Aligned | Retain required-field validation and catalogue/reference consistency. | Ionut/Silvana; Dawid/Alina implement | Issue #25 and application-field implementation (#151) |
| PRD-APP-04 | Valid application can be submitted and managed. | Draft resume, required-field validation, required-document gating and submission are implemented and passed end to end. | Aligned | Repeat positive and negative submission checks after form or rule changes. | Alina and Dawid | Issue #25 and automated E2E evidence |
| PRD-DOC-01 | Upload passport copy, transcripts, certificates and optional English test. | Typed metadata and upload controls exist for all four types; passport copy, transcripts and certificates are required, while the English test is optional. | Aligned | Maintain the type list and required/optional rule together across UI, service and documentation changes. | Dawid and Alina; Silvana documents/tests | Issue #25 multi-document production test; architecture and schema documentation |
| PRD-DOC-02 | Documents stored in Firebase Storage and metadata in Firestore. | Objects are stored below the application Storage path; Firestore stores `path`, `name` and `uploadedAt` in the application's `documents` map. | Aligned | Preserve owner/scoped-admin access and keep the legacy `documentPath` migration explicit. | Dawid; Silvana documents/tests | Issue #25 upload/admin-view evidence; `docs/schema-documentation.md` |
| PRD-DOC-03 | File size and format validation. | Client validation and Storage rules enforce PDF/JPG/PNG and a 10 MB maximum; invalid type and oversized-file production tests passed. | Aligned | Repeat the negative tests after upload-policy or Storage-rule changes. | Dawid and test owner | Issue #25 invalid-type and oversized-file evidence |
| PRD-DOC-04 | Required evidence gates submission. | The UI and `submitApplication()` require non-empty paths for passport copy, transcripts and certificates. Firestore requires each path to be a string but does not yet reject an empty string; the English test remains optional. | Partial | Add explicit non-empty string checks to Firestore rules, then repeat the direct-rule and missing-document tests. | Ionut and Dawid; Silvana tests | Issue #25 missing-required-document evidence; `DOCUMENTS_REQUIRED` service/rule review |

### 4.4 University administration and decisions

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-ADM-01 | View all applications assigned to the admin's university. | The live queue queries by the signed-in admin's `universityId`; populated-list evidence passed. Cross-university browser proof remains limited by one seeded university. | Aligned | Add a second-university denial test when suitable seed data exists. | Ionut and Dawid | Issue #25 admin queue/detail evidence, scoped query and Firestore rules |
| PRD-ADM-02 | Filter applications by status. | Accessible status controls filter the queue across submitted, under-review, offer and rejected states. | Aligned | Maintain filter tests after queue changes. | Ionut | Issue #25 and automated admin-path evidence (#153) |
| PRD-ADM-03 | Search by student name or application ID. | The already university-scoped queue supports case-insensitive name and application-ID search. | Aligned | Review server-side search/indexing if dataset scale exceeds the current client-filtered approach. | Ionut and Dawid | Automated admin-path search evidence and `app/admin/page.js` |
| PRD-ADM-04 | Show application counts per status. | The admin overview and filter controls show counts for each supported queue status. | Aligned | Review aggregation strategy before large-scale use. | Ionut and Dawid | Admin overview/filter evidence and `app/admin/page.js` |
| PRD-ADM-05 | View full student profile. | The scoped application detail view shows the submitted personal, academic and course fields needed for review. | Aligned | Maintain data minimisation and scoped-access tests. | Ionut and Dawid | Issue #25 admin-detail evidence |
| PRD-ADM-06 | Download uploaded documents securely. | The scoped admin detail view exposes authorised document-view controls; production document viewing passed. | Aligned | Add cross-university denial evidence when a second university is seeded. | Ionut and Dawid | Issue #25 document-view evidence and Storage/Firestore rules |
| PRD-ADM-07 | Add internal notes. | Schema, helper and scoped-rule work exists on the unmerged `feature/internal-notes` branch, but it is not part of the integrated platform. | Partial | Complete review, merge the approved implementation and verify admin/student access boundaries. | Silvana and Dawid; Ionut UI | Feature-branch rules/tests, merged PR and browser evidence |
| PRD-ADM-08 | Change status to Under Review, Offered or Rejected. | The admin detail flow supports under review, offer and rejection states with recorded history and notifications. | Aligned | Maintain transition and repeat-decision tests. | Ionut and Dawid | Issue #25 and automated admin-path evidence |
| PRD-DEC-01 | Admin selects offer/rejection and adds a custom message. | The decision UI requires an offer/rejection choice and non-blank custom message. | Aligned | Retain blank-message and both-outcome tests. | Ionut | Issue #25 decision screenshots and negative test |
| PRD-DEC-02 | Decision saved in Firestore and history logged. | Atomic update plus append-only history exists; live offer and rejection records passed. | Aligned | Add explicit denied-write evidence when multi-university test data is available. | Dawid and Ionut | Issue #25 decision history and provider evidence |
| PRD-DEC-03 | Automated decision email sent to student. | The protected decision route is integrated with the UI; offer and rejection emails were delivered with provider IDs. | Aligned | Repeat both outcomes after material email or decision changes. | Ionut/email owner; Dawid reviews | Issue #25 received emails, history and provider-ID evidence |

### 4.5 Email and data structure

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-EMAIL-01 | Registration confirmation email. | A protected welcome route sends the distinct account-created message through Resend. | Aligned | Repeat delivery checks after material email changes. | Ionut and Dawid | Issue #25 received-email evidence and `welcome-{uid}` log |
| PRD-EMAIL-02 | Email verification. | Firebase Auth owns the verification action; integrated delivery and action passed on production. | Aligned | Keep the Firebase template action URL aligned with the canonical domain. | Dawid and Alina | Issue #25 verification evidence |
| PRD-EMAIL-03 | Application submission confirmation. | A protected owner-only route sends after committed submission, writes `submission-{applicationId}` and creates an in-app notification. | Aligned | Repeat on meaningful integrated builds. | Email owner and Dawid | Issues #21/#25 received email, notification and log evidence |
| PRD-EMAIL-04 | Application status-update email. | A protected admin-scoped route sends the retained `under_review` event once and creates an in-app notification. | Aligned | Record any additional approved status events before implementation. | Ionut, email owner and Dawid | Issues #21/#25 under-review email and notification evidence |
| PRD-EMAIL-05 | Offer and rejection notifications. | Protected decision delivery reads the committed decision/message, uses deterministic logging and updates the student notification view. | Aligned | Repeat both outcomes after material decision-flow changes. | Ionut and Dawid | Issue #25 provider IDs, received emails and screenshots |
| PRD-EMAIL-06 | HTML templates, environment-held credentials, email logs and failed-delivery handling. | Server-only credentials, templates, deterministic send claims and sent/failed logging are implemented; production success passed. | Partial | Add explicit production-safe failure, retry and duplicate-send evidence and standardise submission-log fields. | Dawid reviews; Ionut coordinates | Route tests, provider IDs and redacted logs |
| PRD-DATA-01 | `users` with role, profile data and timestamps. | User profiles include role, required registration profile fields, privacy consent and timestamps; admin scope is recorded only for admin profiles. | Aligned | Keep rules, registration writes and schema documentation synchronized. | Dawid and Silvana | `docs/schema-documentation.md`, `lib/auth.js` and `firestore.rules` |
| PRD-DATA-02 | `universities` with name and `adminUserIds`. | University reference exists; admins instead carry `universityId`. | Substituted design | Record why the user-side foreign key replaces `adminUserIds`; test multi-admin/isolation. | Dawid and Silvana | Decision and rules tests |
| PRD-DATA-03 | `applications` with student, university, course, status and timestamps. | Applications store student/university identifiers, validated course and intake data in `form`, lifecycle status and timestamps. | Aligned | Keep the embedded form schema documented and validated. | Dawid and Alina | Schema documentation and issue #25 application evidence |
| PRD-DATA-04 | `documents` with application, file type, URL/path and timestamp. | An embedded `applications.documents` map records typed entries with `path`, `name` and `uploadedAt`; no top-level collection is used. | Substituted | Confirm the embedded map as the accepted equivalent model and retire legacy `documentPath` when compatibility is no longer required. | Dawid and Silvana | `docs/schema-documentation.md`, issue #25 document tests and model review |
| PRD-DATA-05 | `notifications` with user, message, read state and timestamp. | Implemented server-side with `userId`, `applicationId`, `message`, `readStatus` and `createdAt`; students read their own and may only mark them read. | Aligned | Repeat owner/denial checks after notification-rule changes. | Ionut and Silvana | `docs/schema-documentation.md`, `firestore.rules` and issues #21/#25 |

### 4.6 Non-functional, UX, testing and delivery

| PRD ID | Requirement | Current position | Status | Corrective action | Owner area | Acceptance evidence |
|---|---|---|---|---|---|---|
| PRD-NFR-01 | Optimised Firestore queries. | Scoped queries/indexes are designed; evidence is incomplete. | Partial | Review query plans/indexes and avoid unbounded reads. | Dawid | Index export and query tests |
| PRD-NFR-02 | Pagination for application lists. | The admin queue initially shows ten filtered results and progressively reveals further pages with an accessible "Show more" control. | Aligned | Move to cursor/server pagination if production volume makes client-side loading unsuitable. | Dawid and UI owners | Queue implementation (#153) and browser evidence |
| PRD-NFR-03 | Lazy loading where applicable. | Not explicitly designed/evidenced. | Missing/evidence gap | Identify large routes/assets and document loading strategy. | Frontend owners | Build analysis and browser evidence |
| PRD-NFR-04 | Security rules, role access, secure documents and no frontend credentials. | Rules and secret controls exist. Issue #193 records live production evidence that four prohibited deletes were refused for the dedicated student and Solent admin test accounts. | Partial | Complete the remaining allowed/denied matrix and maintain reviewed rule-deployment evidence. | Dawid | Rules tests, deployment evidence, secret scan and Issue #193 live refusal output |
| PRD-NFR-05 | Multiple universities. | Model supports scoping; limited seeded evidence. | Partial | Seed a second university/admin and prove isolation. | Dawid and test owner | Cross-university test |
| PRD-NFR-06 | Handle thousands of concurrent users. | Not demonstrated. | Missing/evidence gap | Define measurable capacity target and run approved non-destructive performance testing. | Dawid and Ionut | Results and limitations |
| PRD-NFR-07 | Modular and maintainable architecture. | Shared services and documentation exist. | Aligned/ongoing | Maintain boundaries, checks and documentation. | Whole team | Code review and build checks |
| PRD-NFR-08 | GDPR-compliant storage and deletion on request. | Issue #193 verifies that the dedicated student and Solent admin test accounts cannot delete application or decision records. The separate controlled erasure/anonymisation process remains deferred under IS-06. | Missing | Define retention, export/delete/anonymise behaviour, implement and test a controlled deletion request. | Ionut/Silvana; Dawid implements | Issue #193 refusal evidence; policy and controlled deletion test still required |
| PRD-UX-01 | Clean responsive academic UI. | Public, authentication and portal screens use a consistent academic design; applicant flows passed desktop and 390 px mobile checks. | Aligned | Repeat responsive checks after significant layout changes. | Alina and Ionut | Issue #21 browser evidence and frontend review |
| PRD-UX-02 | Clear status indicators. | Student and admin views display text-labelled status badges and progress stages. | Aligned | Maintain text labels and colour-independent meaning. | Alina | Issue #25 status screenshots and status mapping tests |
| PRD-UX-03 | Confirmation dialogs for critical actions. | Not consistently implemented. | Missing | Define critical actions and add accessible confirmations. | UI owners | Interaction tests |
| PRD-UX-04 | Accessible forms and error messages. | Authentication and application forms provide labels, field-specific validation and visible errors; a full accessibility audit remains incomplete. | Partial | Run keyboard, error-association and contrast checks across every retained route. | UI owners/test owner | Accessibility checklist and issue #25 validation evidence |
| PRD-ERR-01 | Friendly errors and graceful network handling. | Controlled validation, loading, empty and denied states exist, but timeout/offline and retry coverage remains incomplete. | Partial | Test timeout/offline, provider failure and retry states. | Feature owners | Negative-path browser tests |
| PRD-ERR-02 | Log auth failures, permission violations and email errors. | Email routes record limited sent/failed evidence server-side; a complete privacy-safe auth/permission logging and retention policy is still absent. | Partial | Define allowed auth/permission fields and retention; standardise email-log fields without exposing personal data. | Dawid and Silvana | Redacted log samples and approved logging policy |
| PRD-TEST-01 | Unit tests for core logic. | Merged tests cover decision email construction/idempotency, upload policy and status labels; broader validation, lifecycle and authorisation coverage remains limited. | Partial | Add focused tests for application validation, lifecycle and authorisation helpers. | Feature owners | CI output and `tests/*.test.mjs` |
| PRD-TEST-02 | Integration testing for authentication/application flow. | The integrated applicant, admin review, document, decision, notification and email path was executed on production build `1b50522`. Issue #193 additionally verifies live deletion refusal across student, admin and decision-history scenarios. | Aligned | Repeat the smoke/demo path on meaningful integrated builds and record any regression. | Test and feature owners | Issue #25 pass/fail record, Issue #193 live refusal record, screenshots and `UAAMS_Test_Record_Week4.docx` |
| PRD-TEST-03 | Manual UAT. | Planned but not completed. | Missing | Use representative users, approved scenarios and consent-safe findings. | Silvana/test owner | UAT protocol/findings |
| PRD-TEST-04 | Email delivery testing. | Welcome, submission, under-review and decision delivery passed on production; deterministic duplicate protection is implemented in code. | Partial | Add explicit failure, retry and duplicate-send evidence. | Email/test owners | Issues #21/#25 received emails, provider IDs and logs |
| PRD-DEP-01 | Development and production environments. | Vercel previews/production exist; Firebase separation unclear. | Partial | Document and approve separation and test-data policy. | Ionut and Dawid | Environment matrix |
| PRD-DEP-02 | Next.js on Vercel, Firebase per environment and secure variables. | Vercel/secure variables exist; Firebase separation needs evidence. | Partial | Complete configuration guide without secret values. | Ionut and Dawid | Guide and redacted screenshots |
| PRD-DEL-01 | Functional app, student submission portal and admin dashboard. | The retained production journey from applicant sign-in and submission through admin review, decision and student notification is functional. | Aligned | Repeat the integrated path on release candidates and record remaining limitations separately. | Whole team | Issues #21/#25 and `UAAMS_Test_Record_Week4.docx` |
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

### P0 - Close remaining security and scope decisions

1. Record approval for the Resend API substitution and Firebase environment strategy.
2. Add a second university/admin test fixture and prove cross-university isolation.
3. Keep payments, finance/compliance and other additions out of implementation until approved.

### P1 - Close retained functional and reliability gaps

1. Merge and verify the internal-notes implementation after schema/rules review.
2. Add explicit non-empty required-document path checks to Firestore rules.
3. Test password-reset edge cases and complete the protected-route matrix.
4. Add production-safe email failure, retry and duplicate-send evidence.

### P2 - Complete non-functional evidence

1. Implement and test the approved GDPR export/deletion/anonymisation process.
2. Define and test measurable performance/capacity targets.
3. Complete accessibility, error-state, query/index and environment-separation evidence.
4. Run representative manual UAT and record consent-safe findings.

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
