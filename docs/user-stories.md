# UAAMS User Story Catalogue

This catalogue connects stakeholder needs to requirements, implementation issues, tests, and the data model. User stories describe value for a UAAMS user; frontend, backend, email, testing, and documentation work are delivery tasks linked to the story.

## Story Format and Status

Use: **As a _persona_, I want _capability_ so that _benefit_.**

Story status is one of: `Sprint 2`, `Product backlog`, `Proposed`, `Deferred`, or `Done`. A proposed story is not an implementation commitment until the client or supervisor confirms it.

## Epics

| Epic | Product area | Sprint 2 position |
|---|---|---|
| EP-01 | Identity and access | Active |
| EP-02 | University and course catalogue | University reference data active; course/intake are mandatory PRD backlog scope |
| EP-03 | Student applications | Active |
| EP-04 | Document management | Basic upload active; request workflow proposed |
| EP-05 | Payments | Out of original PRD scope; change approval required |
| EP-06 | Financial compliance | Proposed addition; change approval required |
| EP-07 | Admissions review and decisions | Active |
| EP-08 | Notifications and email | Basic email active; PRD notification meaning requires decision/completion |

## Sprint 2 Stories

| ID | Epic | User story | Story issue | Delivery task(s) | Lead / support | Status |
|---|---|---|---|---|---|
| US-01 | EP-01 | As an applicant, I want to register and verify my email so that I can securely use UAAMS. | #45 | #7, #8, #18 | Alina / Dawid, Sorin, Cornel | Sprint 2 |
| US-02 | EP-01 | As an authorised user, I want role-appropriate access so that protected functions and data are not exposed. | #46 | #7, #14 | Dawid / Ionut, Cornel | Sprint 2 |
| US-03 | EP-02 | As an applicant, I want to view available universities so that I can choose where to apply. | #47 | #10 | Alina / Dawid | Sprint 2 |
| US-04 | EP-03 | As an applicant, I want to create and submit an application so that it can be reviewed. | #48 | #10 | Alina / Dawid, Cornel | Sprint 2 |
| US-05 | EP-03 | As an applicant, I want to see my applications and their statuses so that I understand their progress. | #49 | #9 | Alina / Dawid, Cornel | Sprint 2 |
| US-06 | EP-04 | As an applicant, I want to upload one permitted document so that the university can review my evidence. | #50 | #6, #11 | Alina, Dawid / Cornel | Sprint 2 |
| US-07 | EP-07 | As an admissions officer, I want to see only applications for my university so that I can review the correct applicants. | #51 | #12, #14 | Ionut, Dawid / Cornel | Sprint 2 |
| US-08 | EP-07 | As an admissions officer, I want to open an application and see its submitted data and document metadata so that I can prepare a decision. | #52 | #13 | Ionut / Dawid, Cornel | Sprint 2 |
| US-09 | EP-07 | As an admissions officer, I want to offer or reject with a message so that the applicant receives a recorded outcome. | #53 | #15 | Ionut / Dawid, Sorin, Cornel | Sprint 2 |
| US-10 | EP-08 | As an applicant, I want to receive important emails so that I remain informed when I am not using UAAMS. | #54 | #16-#19 | Sorin / Dawid, Ionut, Cornel | Sprint 2 |

## Product Backlog and Proposed Change Stories

| ID | Epic | User story | Structural consequence | Status |
|---|---|---|---|---|
| US-11 | EP-02 | As an applicant, I want to apply to a specific course and intake so that the university knows which programme and entry point I selected. | `courses`; `applications.courseId`; intake; university/course consistency | Mandatory PRD backlog |
| US-12 | EP-04 | As an admissions officer, I want to request an additional document so that missing evidence can be supplied. | `documentRequests`; request lifecycle; notifications | Proposed |
| US-13 | EP-04 | As an applicant, I want to upload a requested document so that review can continue. | `documents`; Storage metadata; request status | Proposed |
| US-14 | EP-05 | As an applicant, I want to pay an application fee so that my application can enter review. | `payments`; currency; provider reference; lifecycle gate | Out of original PRD scope; approval required |
| US-15 | EP-06 | As a compliance officer, I want to verify financial evidence so that the financial requirement is recorded. | compliance role; `financeChecks`; retention/security rules | Proposed addition; approval required |
| US-16 | EP-07 | As an admissions officer, I want to make a conditional offer so that outstanding conditions are clear. | decision type; structured conditions; condition status | Proposed addition; approval required |
| US-17 | EP-08 | As an applicant, I want to see all notifications in one place so that I do not miss an action. | `notifications`; type; read state; application link | Mandatory PRD decision/backlog |

Additional corrective delivery work for registration fields, full application data, typed documents, admin search/filter/counts/notes, submission/status emails, pagination and GDPR deletion is tracked in `docs/prd-compliance-register.md`. New GitHub issues must use the PRD IDs from that register.

## Acceptance-Criteria Example

### US-05 - View application status

- **Given** I am logged in as an applicant,
- **When** I open my dashboard,
- **Then** I see only my applications,
- **And** every application has a text-labelled status,
- **And** empty, loading, and error states are clear,
- **And** the layout works at mobile and desktop widths.

## Ownership Rule

Each selected story has one story lead and named supporting owners. A developer task such as “create a Firestore query” is not a separate user story unless the developer is genuinely the product user. UI design decisions are recorded as design rationale and NFR evidence beneath the user story they support.
