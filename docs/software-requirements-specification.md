# UAAMS Software Requirements Specification

## 1. Purpose and Scope

UAAMS supports the complete product scope defined by the original PRD. Sprint 2 selects a minimum proof-of-concept increment: applicant identity, application submission with one document, university-scoped admissions review, an offer/reject decision, and applicant notification. The reduced increment does not remove broader PRD requirements. Course/intake, typed required documents and system notifications remain mandatory Product Backlog requirements unless the client approves a change. Payment, financial compliance, conditional offers and document-request workflows are additions that require stakeholder approval before implementation.

## 2. User Classes

- **Applicant:** registers, verifies identity, creates an application, uploads evidence, and tracks status.
- **Admissions officer:** reviews only applications belonging to the officer's university and records decisions.
- **Compliance officer:** proposed Sprint 3 role for financial-evidence review.
- **Project team/administrator:** operates deployment, evidence, and support processes; this is not automatically an application role.

## 3. Functional Requirements

| ID | Requirement | Source story | Sprint status |
|---|---|---|---|
| FR-01 | The system shall allow an applicant to register with email, password, full name, nationality, intended study level and recorded acceptance of the approved privacy policy. | US-01 | Part Sprint 2; corrective backlog required |
| FR-02 | The system shall send an email-verification action and restrict the protected journey until verification. | US-01 | Sprint 2 |
| FR-03 | The system shall allow an applicant to log in, log out, and request a password reset. | US-01 | Sprint 2 |
| FR-04 | The system shall store an applicant profile with a controlled role. | US-01, US-02 | Sprint 2 |
| FR-05 | The system shall display available university reference data to an authenticated applicant. | US-03 | Sprint 2 |
| FR-06 | The system shall allow an applicant to create and submit an application containing the PRD-required personal, academic, university, course and intake information. | US-04, US-11 | Part Sprint 2; corrective backlog required |
| FR-07 | The system shall display the authenticated applicant's applications and current statuses. | US-05 | Sprint 2 |
| FR-08 | The system shall securely store typed application documents and metadata, including passport, transcript, certificate and optional English-test evidence, with approved format and size validation. The one-document Sprint 2 path is an interim increment only. | US-06 | Interim Sprint 2; full compliance backlog required |
| FR-09 | The system shall allow an admissions officer to list only applications for the officer's assigned university, filter by status, search by student/application ID and view status counts. | US-07 | Part Sprint 2; corrective backlog required |
| FR-10 | The system shall allow an admissions officer to view the full authorised application/profile, securely access documents and maintain approved internal notes. | US-08 | Part Sprint 2; corrective backlog required |
| FR-11 | The system shall allow an admissions officer to record an offer or rejection with a message. | US-09 | Sprint 2 |
| FR-12 | The system shall preserve an append-only decision history. | US-09 | Sprint 2 |
| FR-13 | The system shall send the retained PRD email events—including verification, submission, status and decision notifications—and record appropriate delivery/failure evidence. | US-10 | Part Sprint 2; corrective backlog required |
| FR-14 | The system shall allow an applicant to select a course and intended intake belonging to a university. | US-11 | Mandatory Product Backlog requirement |
| FR-15 | The system shall support additional-document requests and their requested/received/verified lifecycle. | US-12, US-13 | Proposed Sprint 3 |
| FR-16 | If separately approved as a PRD scope change, the system shall record an application-fee payment and its lifecycle. | US-14 | Out of original PRD scope; approval required |
| FR-17 | If separately approved as a PRD scope change, the system shall allow an authorised compliance officer to record a finance check. | US-15 | Proposed addition; approval required |
| FR-18 | If separately approved as a PRD scope change, the system shall distinguish conditional and unconditional offers and record conditions. | US-16 | Proposed addition; approval required |
| FR-19 | The system shall provide the approved system-notification experience, including read/unread state if in-app notifications are retained. | US-17 | Mandatory PRD decision/backlog requirement |

## 4. Non-Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-01 | Secrets, service-account keys, and private credentials shall not be committed to Git. | Repository scan and `.gitignore` review |
| NFR-02 | Applicants shall only read their own applications and related records. | Allowed/blocked security-rule test |
| NFR-03 | Admissions officers shall only read applications for their assigned university. | Cross-university access test |
| NFR-04 | Status, success, warning, and error information shall not rely on colour alone. | UI/accessibility review |
| NFR-05 | Applicant and officer screens shall support mobile and desktop widths used in the demonstration. | Responsive screenshots/tests |
| NFR-06 | Forms shall expose labelled controls and clear loading, success, validation, and error states. | UI test cases |
| NFR-07 | An application decision and its audit entry shall be written atomically. | Code review and integration test |
| NFR-08 | Shared Firebase functions shall be used instead of duplicating direct Firebase access across screens. | Code review |
| NFR-09 | The stable live build shall be produced from `main`; feature work shall reach it through reviewed pull requests. | Git and Vercel evidence |
| NFR-10 | Every completed story shall have traceable acceptance-test and report evidence. | Traceability review |
| NFR-11 | Application lists shall use an approved pagination strategy and avoid unbounded reads. | Query review and pagination tests |
| NFR-12 | The system shall support an approved GDPR data-access and deletion/anonymisation process. | Policy review and deletion-request test |
| NFR-13 | The implementation shall record and verify an agreed measurable performance/capacity target. | Non-destructive performance test and limitations report |

## 5. Business Rules

- Unverified applicants cannot proceed through the protected application journey.
- Applicant-created profiles use the applicant/student role; privileged roles are not self-assigned.
- University reference data is client read-only in Sprint 2.
- Applications follow the approved status lifecycle documented in the schema.
- Decision history is append-only.
- Original PRD requirements remain Product Backlog requirements until completed or formally changed.
- Features explicitly out of scope in the PRD do not become implementation commitments without an approved change request.
- Technical substitutions such as Resend API for direct SMTP require a recorded decision demonstrating equivalent business and security outcomes.

## 6. External Interfaces

- Firebase Authentication for identity and email actions.
- Firestore for application data and security scoping.
- Firebase Storage for application documents.
- Vercel for preview and stable deployments.
- Selected email provider for decision email delivery.

## 7. Assumptions and Open Decisions

Open decisions are maintained in `docs/issues-and-open-questions.md`. Compliance and corrective actions are maintained in `docs/prd-compliance-register.md`. The evolved ERD must not overrule the PRD: course/intake and notification requirements need implementation or an approved waiver, while payments, compliance roles, conditional offers and other additions require a client-approved scope change before implementation.
