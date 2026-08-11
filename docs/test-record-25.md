# Issue #25 - Integrated Six-Step Demo-Path Test Record

**Purpose:** Record execution results and evidence for the complete UAAMS applicant-to-decision journey on an integrated production build.

**Test definition:** [Sprint 2 Test Plan](test-plan.md). That document defines the tests; this document records their outcomes and evidence.

**Canonical target build:** `https://www.uaams.website`

**Expected production commit:** `29d0d06d49253e5e63f0defd08b008a8fe4de163`

**Tester:** Silvana

**Result values:** `Pass`, `Fail`, `Blocked`, `Not implemented`, `Not run`

## Safety and evidence rules

- Run browser steps manually. This script must not create, change or delete Firebase data automatically.
- Use only team-approved test accounts and fictional test information.
- Never record passwords, Firebase ID tokens, API keys, service-account JSON, `.env` values or personal student data.
- Use a normal browser window for the applicant and a private/incognito window for the admissions officer.
- Capture the production URL and visible page state in every screenshot.
- Keep the browser URL bar visible so the evidence proves the canonical host was tested.
- Hide email addresses, student UIDs, application IDs and other identifiers unless they are essential evidence.
- Never capture a password field containing visible text.
- A successful build or HTTP response is not proof that the user journey works.
- A provider acceptance response is not proof that an email reached the mailbox.
- Do not mark a case `Pass` unless every expected result is observed.

## Session record

Complete this before testing:

| Field | Record |
|---|---|
| Test date/time | |
| Tester | Silvana |
| Build URL | `https://www.uaams.website` |
| Tested commit | `29d0d06` |
| Vercel deployment | Record the deployment marked `Production` |
| Applicant browser/device | |
| Admin browser/device | |
| Firebase project ID | Project ID only; no credentials |
| Applicant test account | Record only a masked/team-controlled email |
| Admin role/university | Record role and university; no password |
| Second-university test data available? | Yes / No |
| Valid upload samples | Small PDF, JPG and PNG |
| Invalid upload samples | File over 10 MB; unsupported type |
| Evidence folder/link | |

## Existing evidence supplied by Alina

Alina reported the following real-browser results from 27 July 2026 on the
live deployment at desktop and 390 px mobile widths. Link her comments on
issues #21 and #25 rather than presenting this as Silvana's own execution.

| Applicant-side check | Reported result |
|---|---|
| Registration and redirect to verification | Pass |
| Real verification email and verification link | Pass |
| Verified login | Pass |
| Unverified account blocked and redirected | Pass |
| All four application sections and required-field validation | Pass |
| Valid PNG upload, attachment and submission | Pass |
| Student portal displays `Submitted` | Pass |
| Duplicate registration email | Pass |
| Unsupported `.docx` upload | Pass |

Before reusing this evidence for #25 sign-off, link it to the exact Production
deployment/commit. Issue #25 still requires one unambiguous build, a pass/fail
table and evidence per step.

## Silvana's remaining execution focus

Silvana owns the admin-to-decision portion of the path:

1. Admin queue contains the submitted application.
2. Non-admin refusal evidence is linked (already captured).
3. Admin detail shows the submitted answers and document.
4. One application receives an offer with a custom message.
5. A second student/application receives a rejection with a custom message.
6. Student status/message updates are confirmed for both outcomes.
7. Each received email is from `admissions@uaams.website`.
8. Resend evidence shows provider ID and `Delivered` status.
9. Blank decision-message validation is captured.
10. An oversized-file rejection is captured if no existing evidence is supplied.

Cross-university isolation was originally recorded as **Not testable** because only one institution was seeded, so there was no second-university boundary to test. It is now **Pass**: automated e2e workflow run #19 confirmed that each university administrator can access only applications assigned to their own university.

## Six-step implementation map

| Step | Route and component | Client/service logic | Server/security logic |
|---|---|---|---|
| 1. Student registers | `/register`; `app/register/page.js` | Validates full name, nationality, study level, email, password, confirmation and privacy consent. Calls `registerStudent()` in `lib/auth.js`. | Firebase Auth creates the account. Firestore creates `/users/{uid}` with role `student` and consent evidence. |
| 2. Student verifies email | `/verify-email`; `app/verify-email/page.js` | Handles verification guidance, resend and `mode=verifyEmail&oobCode=...`. Calls `confirmEmailVerification()` or `resendVerification()` in `lib/auth.js`. | Firebase Auth validates and applies the action code. Protected UI, Firestore and Storage require a verified account. |
| 3. Student submits with one document | `/apply`; `app/apply/page.js` | Validates all form fields, resumes/saves one draft, uploads one permitted file, then calls `submitApplication()`. | `lib/db.js` requires `documentPath`. Firestore rules require a non-empty `documentPath` for `draft -> submitted`. Storage rules enforce owner, verification, type and 10 MB maximum. |
| 4. Scoped admin views application | `/admin`; `app/admin/page.js`, then `/admin/applications/{id}`; `app/admin/applications/[id]/page.js` | Loads the admin profile, queries the admin university, checks the selected record's university and displays form/document/history. | Firestore rules allow only verified admins whose `universityId` matches the application. Storage rules apply the same scope to document reads. |
| 5. Admin offers/rejects with message | `/admin/applications/{id}` | UI requires Offer/Reject and a trimmed message. Calls `recordDecision()` in `lib/db.js`, then `/api/email/decision`. | Firestore batch updates status/message and appends a decision record. Rules restrict decision values and admin scope; decision records are append-only. |
| 6. Email and student status update | `/api/email/decision`; student checks mailbox and `/student` or `/student/applications/{id}` | Admin page reports saved/send outcomes and supports email retry. Student dashboard/detail reads current status, latest message and decision history. | Server verifies token, verified admin, university scope, committed decision/history and verified student email. Resend sends with a per-decision idempotency key; `emailLogs` records sending/sent/failed. |

## Blocking happy-path cases

### 1. E2E-25-01 - Complete offer journey

**Sprint sign-off:** Blocking

**Preconditions**

- Production displays commit `29d0d06`.
- A new team-controlled applicant email is available.
- A verified admissions account exists for the selected university.
- Firebase Storage and deployed rules are available.
- Resend sender/domain and server variables are configured.
- A fictional applicant profile and a valid PDF under 10 MB are ready.

**Exact steps**

1. In the applicant browser, open `https://www.uaams.website/register`.
2. Enter fictional valid details, a valid email, a password of at least eight characters containing an uppercase letter and a number, matching confirmation, and privacy consent.
3. Select **Create account**.
4. Confirm the page directs the applicant to email-verification guidance without reporting a false success.
5. Open the newest verification email and follow its link.
6. Confirm verification succeeds, then sign in at `/login`.
7. Confirm the applicant reaches `/student`.
8. Open `/apply`.
9. Complete every required field and save the draft.
10. Refresh or revisit `/apply`; confirm the saved draft is resumed with the entered values.
11. Select a valid PDF smaller than 10 MB and choose **Upload document**.
12. Confirm **Document attached** appears only after upload succeeds.
13. Select **Submit application**.
14. Confirm submission succeeds and the applicant returns to `/student` with status **Submitted**.
15. In the private/incognito admin browser, sign in with the admissions account for the same university.
16. Confirm `/admin` lists the new application.
17. Open **View details** and compare the visible answers and document name with the applicant submission.
18. Select **View document** and confirm the correct file opens.
19. Choose **Offer a place**, enter a distinctive non-empty test message and submit once.
20. Confirm the UI reports that the decision was recorded. Record the separate email result exactly as shown.
21. Confirm status **Offer made**, the message and a new decision-history entry appear on the admin page.
22. In the applicant mailbox, confirm exactly one matching offer email arrives from `admissions@uaams.website`.
23. Refresh `/student` and open `/student/applications/{id}`.
24. Confirm **Offer made**, the exact decision message and decision history appear for the correct application.
25. Capture the matching Resend log with provider ID and `Delivered` status.

**Expected result**

- All six steps complete on the same production build.
- Registration and verification are honest and successful.
- Saved draft data is retained and no duplicate draft is created during the tested journey.
- Submission is impossible until the valid document is attached.
- Only the correctly scoped admin sees and opens the application/document.
- One offer decision and one matching audit record are created.
- Exactly one offer email reaches the applicant.
- Admin, email and student views agree on outcome and message.

**Evidence to capture**

- Registration success/verification-guidance screenshot.
- Verification-success screenshot with personal data hidden.
- Resumed-draft screenshot.
- Successful upload and Submitted dashboard screenshots.
- Scoped admin queue and detail screenshots.
- Document-open evidence without exposing document contents unnecessarily.
- Offer confirmation, decision history and email-delivery-state screenshots.
- Redacted received-email screenshot.
- Redacted Resend provider ID and `Delivered` screenshot.
- Student Offer status/message screenshot.
- Test date, production URL and commit SHA.

**Actual result:**
**Result:** Not run
**Evidence link:**
**Issue/notes:**

### 2. E2E-25-02 - Complete rejection journey

**Sprint sign-off:** Blocking

**Preconditions**

- Same environment as E2E-25-01.
- Use a separate new applicant/application so the offer evidence remains unchanged.

**Exact steps**

1. Repeat registration, verification, login, draft, upload and submission using a new test applicant/application.
2. Sign in as the correctly scoped admissions officer.
3. Open the submitted application.
4. Choose **Reject the application**.
5. Enter a distinctive non-empty rejection message and submit once.
6. Confirm the admin status becomes **Not successful** and the history contains the rejection.
7. Confirm exactly one rejection email arrives from `admissions@uaams.website` and does not claim an offer.
8. Refresh the applicant dashboard and application detail.
9. Confirm the rejection status and exact message appear.
10. Capture the matching Resend log with provider ID and `Delivered` status.

**Expected result**

- Rejection succeeds end to end on the same integrated build.
- Admin, email and student views agree.
- Exactly one matching rejection email is received.

**Evidence to capture**

- Submitted application, admin rejection, audit history, redacted received email,
  Resend provider ID/`Delivered`, and student status/message screenshots.

**Actual result:**
**Result:** Not run
**Evidence link:**
**Issue/notes:**

## Blocking validation and security cases

### 3. AUTH-25-01 - Registration validation

**Sprint sign-off:** Blocking

**Preconditions:** `/register` is open.

**Exact steps**

1. Submit with all fields empty.
2. Try an invalid email.
3. Try a password shorter than eight characters.
4. Try a password without an uppercase letter.
5. Try a password without a number.
6. Try a mismatched confirmation.
7. Leave privacy consent unticked.

**Expected result**

- Clear field-level errors appear.
- Submission is blocked and no success is claimed.

**Evidence to capture:** One screenshot showing representative field errors.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 4. AUTH-25-02 - Duplicate registration

**Sprint sign-off:** Blocking

**Preconditions:** A team-controlled test account already exists.

**Exact steps**

1. Attempt registration again with the same email.

**Expected result**

- The page states that the account already exists.
- No duplicate profile is created and no success is shown.

**Evidence to capture:** Existing-account error screenshot.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 5. AUTH-25-03 - Unverified applicant is blocked

**Sprint sign-off:** Blocking

**Preconditions:** Registered but unverified applicant.

**Exact steps**

1. Sign in before verification.
2. Attempt to open `/student`.
3. Attempt to open `/apply`.

**Expected result**

- Login redirects to verification guidance.
- Student dashboard and application form refuse protected access.
- No applicant data can be created/read through the normal UI.

**Evidence to capture:** Verification guidance and blocked `/apply` state.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 6. AUTH-25-04 - Verification failure and resend

**Sprint sign-off:** Blocking

**Preconditions:** Unverified applicant; newest verification email available.

**Exact steps**

1. Open a used, invalid or expired verification URL.
2. Confirm a clear error appears.
3. Return to verification guidance and request a resend.
4. Repeat rapidly only if the team permits a throttling check.

**Expected result**

- Invalid/expired code does not grant access.
- Resend success is shown only after Firebase accepts the request.
- Throttling/network failure shows an honest error.

**Evidence to capture:** Invalid-link and resend-result screenshots.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 7. APP-25-01 - Required fields and honest draft save

**Sprint sign-off:** Blocking

**Preconditions:** Verified applicant on `/apply`.

**Exact steps**

1. Leave required fields empty and select **Save draft**.
2. Complete all fields and save.
3. Change a value and save again.
4. Refresh/revisit `/apply`.

**Expected result**

- Empty fields are identified and no save success is shown.
- **Draft saved** appears only after the write succeeds.
- The second save updates the same draft.
- The newest values are restored on return.

**Evidence to capture:** Required-field errors and resumed updated draft.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 8. APP-25-02 - Document is mandatory

**Sprint sign-off:** Blocking

**Preconditions:** Valid saved draft with no attached document.

**Exact steps**

1. Observe the Submit button before upload.
2. Attempt submission if keyboard/browser tools permit activation.
3. Refresh the dashboard.

**Expected result**

- Submit remains disabled or submission displays **Upload one permitted document before submitting**.
- Application remains `draft`.
- No submitted success is claimed.

**Evidence to capture:** Disabled/blocked submission and Draft status.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 9. APP-25-03 - Valid upload types and 10 MB boundary

**Sprint sign-off:** Blocking

**Preconditions:** Verified applicant and valid draft; PDF/JPG/PNG samples.

**Exact steps**

1. Upload a small PDF.
2. On separate disposable drafts or only if team-approved replacement is safe, repeat with JPG and PNG.
3. Test a file exactly 10 MB if available.

**Expected result**

- PDF, JPG and PNG are accepted.
- A file exactly 10 MB is permitted by client policy and deployed Storage rules.
- Success appears only after Storage upload and application link update succeed.

**Evidence to capture:** Successful upload states and filenames/types; do not expose personal document contents.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 10. APP-25-04 - Oversized and unsupported files

**Sprint sign-off:** Blocking

**Preconditions:** Valid draft; file over 10 MB; unsupported DOCX/EXE sample.

**Exact steps**

1. Select and attempt to upload a file over 10 MB.
2. Select and attempt to upload an unsupported file.
3. If available, test a file with an allowed extension but an unexpected MIME type.

**Expected result**

- Oversized file shows: **That file is too large. Please upload a file no bigger than 10 MB.**
- Unsupported file shows: **That file type isn't supported. Please upload a PDF, JPG, or PNG.**
- Storage rejection is shown as a failure; no document is reported attached.

**Evidence to capture:** Visible rejection messages.

**Known risk:** Client validation accepts a recognised extension or MIME type, while Storage rules require an allowed MIME type. A permitted extension with an unexpected MIME type may pass the first check and fail during upload.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 11. ADM-25-01 - University-scoped queue and detail

**Sprint sign-off:** Blocking

**Preconditions:** Verified admin for university A; applications for universities A and B.

**Exact steps**

1. Sign in as the university A admin and open `/admin`.
2. Confirm only university A applications are listed.
3. Open a university A application detail.
4. Attempt to open the known university B detail URL directly.
5. Attempt to open university B's document only using a team-approved test path/link.

**Expected result**

- Queue query returns only university A records.
- In-scope detail/document opens.
- Out-of-scope detail reports not found/not in the queue without disclosing data.
- Firestore and Storage deny out-of-scope access.

**Current execution status:** `Pass`. This case was originally recorded as not testable because only one institution existed. After a second university and administrator were added, [automated e2e workflow run #19](https://github.com/ionuthub/uaams-project/actions/runs/31244214915) confirmed that the in-scope administrator could access the application, the other university could not see it in its queue, and direct access was refused.

**Evidence to capture:** Scoped queue, in-scope detail, and redacted denied/not-found state.

**Actual result:** The in-scope university administrator could access the application. The second university could not see it in the queue, and direct access to the application was refused.
**Result:** Pass
**Permanent evidence from automated e2e workflow run #19:**

- [University A administrator can see the in-scope application](evidence/issue-25/run-19/10-isolation-university-a-can-see.png)
- [University B administrator cannot see the application in its queue](evidence/issue-25/run-19/11-isolation-university-b-queue-empty.png)
- [University B administrator is refused at the direct application URL](evidence/issue-25/run-19/12-isolation-university-b-direct-url-refused.png)
- [Issue #25 evidence trail](https://github.com/ionuthub/uaams-project/issues/25)

### 12. ADM-25-02 - Non-admin cannot use admissions pages

**Sprint sign-off:** Blocking

**Preconditions:** Verified student account.

**Exact steps**

1. While signed in as the student, open `/admin`.
2. Open a known `/admin/applications/{id}` URL.

**Expected result**

- Admin queue/detail is denied.
- No application or decision data is exposed.

**Evidence to capture:** Denied states.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 13. DEC-25-01 - Decision validation

**Sprint sign-off:** Blocking

**Preconditions:** Scoped admin on a submitted application.

**Exact steps**

1. Submit without selecting Offer/Reject.
2. Select a decision but leave the message empty.
3. Enter only spaces in the message.
4. Enter a valid decision and non-empty message.

**Expected result**

- UI displays **Choose offer or reject** when no choice is selected.
- UI displays **Write the message the student will receive** for empty/whitespace text.
- No decision/email is created for blocked attempts.
- Valid input proceeds.

**Evidence to capture:** Choice and message validation screenshots.

**Known blocking gap:** `recordDecision()` and Firestore rules do not independently reject a blank message. The browser UI and email builder do. Record this as `Fail` or accepted blocker if backend/rules-level enforcement is part of the sign-off requirement.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 14. DEC-25-02 - Atomic decision and append-only history

**Sprint sign-off:** Blocking

**Preconditions:** Scoped admin and submitted application.

**Exact steps**

1. Record one valid decision.
2. Confirm current application status/message and history agree.
3. If team policy permits reversal testing, record the opposite decision.
4. Confirm the previous history remains and a new entry is appended.

**Expected result**

- Each successful batch updates the current application and creates its matching history record together.
- Previous decision records are not edited or removed.

**Evidence to capture:** Current status plus complete history.

**Known behaviour:** Current UI/helper allow a later decision to replace current status while preserving history. This is less strict than a final one-decision-only lifecycle.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 15. EMAIL-25-01 - Honest email failure

**Sprint sign-off:** Blocking

**Preconditions:** Use only a team-approved failure scenario; do not alter production secrets.

**Exact steps**

1. Observe a naturally occurring controlled provider/network failure, or use evidence supplied by the backend owner.
2. Confirm the decision itself remains recorded.
3. Confirm the admin page reports that the email did not send and offers retry.
4. Confirm the email log reports failure without credentials or message body.

**Expected result**

- No false **email sent** success appears.
- Decision remains visible to the applicant.
- Failure is logged with a safe error code.

**Evidence to capture:** Admin failure/retry state and redacted log evidence supplied by an authorised owner.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 16. EMAIL-25-02 - Duplicate-send protection

**Sprint sign-off:** Blocking

**Preconditions:** A successfully sent decision email and its existing decision/log record.

**Exact steps**

1. Select **Retry email** or repeat the same email request for the same committed decision only once.
2. Confirm no second mailbox delivery occurs.
3. Confirm the UI/log reports the existing sent state.

**Expected result**

- Deterministic log ID and Resend idempotency key prevent a duplicate for the same decision record.

**Evidence to capture:** Single mailbox message and existing sent log/admin state.

**Known risk:** Recording a new decision creates a new decision ID and therefore a new idempotency key. This test does not prove duplicate protection across repeated decision writes.

**Actual result:**
**Result:** Not run
**Evidence link:**

## Non-blocking resilience and usability cases

### 17. UI-25-01 - Loading, empty and not-found states

**Sprint sign-off:** Non-blocking unless the state exposes data or falsely claims success.

**Preconditions:** Applicant/admin accounts; known invalid application ID.

**Exact steps**

1. Observe loading states on `/student`, `/apply`, `/admin` and both detail routes.
2. Open dashboards with no records where available.
3. Open a nonexistent application ID as student and admin.

**Expected result**

- Clear loading/empty states appear.
- Invalid IDs show not-found/ownership messages.
- Previous record data is not displayed as current success.

**Evidence to capture:** Representative states.

**Actual result:**
**Result:** Not run
**Evidence link:**

### 18. UI-25-02 - Mobile and keyboard smoke

**Sprint sign-off:** Non-blocking unless a critical action is impossible.

**Preconditions:** Production build; mobile viewport and keyboard access.

**Exact steps**

1. Repeat critical register, apply, admin-detail and decision controls at a mobile width.
2. Navigate primary forms and buttons using the keyboard.
3. Confirm status meaning is available as text, not colour alone.

**Expected result**

- No critical clipping or horizontal loss prevents completion.
- Controls have visible labels/focus and are keyboard operable.
- Status labels remain readable.

**Evidence to capture:** Mobile screenshots and keyboard notes.

**Actual result:**
**Result:** Not run
**Evidence link:**

## Issue #21 live smoke test

### 19. SMOKE-21-01 - Production boot and critical routes

**Sprint sign-off:** Blocking

**Preconditions:** Public production URL available.

**Exact steps**

1. Open `https://www.uaams.website/`.
2. Open `/register`, `/login`, `/verify-email`, `/student`, `/apply` and `/admin`.
3. Confirm each route renders the expected page or correct access guard, not a 404/500.
4. Inspect the browser console for unexpected boot/configuration errors.
5. Run the repository boot check separately if the team wants command evidence:
   `node scripts/smoke.mjs https://www.uaams.website`

**Expected result**

- Homepage and critical routes render.
- Protected routes show correct access states.
- No missing-Firebase-configuration boot failure appears.
- Automated boot smoke reports Firebase config is inlined.

**Evidence to capture:** Homepage/route screenshots, console note and smoke command output.

**Actual result:**
**Result:** Not run
**Evidence link:**

## Code-to-requirement findings to report before sign-off

1. **No top-level documents collection:** Current production code stores one Storage path in `applications.documentPath`. `docs/schema-documentation.md` explicitly says no top-level `documents` collection is implemented. Issue #69 wording must be clarified before documentation claims otherwise.
2. **Required-document documentation contradiction:** `app/apply/page.js`, `lib/db.js` and `firestore.rules` enforce a required document. `docs/schema-documentation.md` correctly describes this in Application Statuses but later incorrectly lists it as missing.
3. **Decision-message defence is incomplete:** The admin UI trims/rejects blank text, and the email builder rejects it. `recordDecision()` and Firestore decision-create rules do not require a non-empty message.
4. **Lifecycle enforcement is less strict than the intended diagram:** UI prevents decisions on drafts, but admin Firestore rules do not check the previous status before setting `under_review`, `offer` or `rejected`.
5. **Repeated decisions are permitted:** Each valid decision creates a new append-only record and may replace the current status. Email deduplication is per decision record, not across multiple decision records.
6. **Upload validation layers differ:** Client policy accepts a recognised extension or MIME type; Storage rules require an allowed MIME type.
7. **Some secondary failures are console-only:** Draft-resume failure, student history failure and admin email-log load failure are logged without a dedicated visible warning, although primary page/write/send failures are surfaced.
8. **No explicit Resend timeout:** `lib/email.js` does not set an `AbortSignal.timeout`, so a hung provider request has no application-level timeout.
9. **Documentation is stale in other places:** Architecture still says issue #15 must call the email route even though the current admin detail page already does. Its blockers table also describes implemented UI/email work as pending.
10. **Authentication action URL risk:** Team reporting says Firebase verification
    and reset templates may still point to the retired host. The expected action
    URL is `https://www.uaams.website/auth/action`. Record the actual host reached
    by real verification/reset links.
11. **Issue #128 remains blocked:** Internal notes do not yet have an approved
    backend schema. Do not report internal notes as implemented.

## Final #25 summary

Complete after execution:

| Measure | Result |
|---|---|
| Blocking cases passed | |
| Blocking cases failed | |
| Blocking cases blocked | |
| Non-blocking cases passed/failed | |
| Full offer journey | Pass / Fail / Blocked |
| Full rejection journey | Pass / Fail / Blocked |
| University isolation | Pass |
| Decision email delivery | Pass / Fail / Blocked |
| Production smoke | Pass / Fail / Blocked |
| Sign-off recommendation | Approve / Do not approve |

**Critical failures/issues raised:**

**Retest build/date:**

**Evidence bundle:**

**Report handoff to Ionut:**

## Week 3 shared-report handoff checklist

Send Ionut:

- Test date, browser, viewport and account roles.
- Canonical URL and exact Production commit/deployment.
- Pass/Fail/Blocked/Not-testable table.
- Links to Alina's issue #21/#25 applicant evidence.
- Silvana's admin queue/detail/decision screenshots.
- Offer and rejection status/message evidence.
- Received-email and Resend provider ID/`Delivered` evidence.
- Oversized-file and blank-decision results.
- Cross-university isolation recorded as passed, with the automated evidence attached to issue #25.
- Known old authentication action-URL risk.
- Issue #128 internal-notes blocker.
- Retest information for every failed critical case.
