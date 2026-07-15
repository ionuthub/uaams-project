# UAAMS Software Requirements Specification

## 1. Purpose and Scope

UAAMS supports a minimum university-application journey: applicant identity, application submission with one document, university-scoped admissions review, an offer/reject decision, and applicant notification. Sprint 2 delivers this proof of concept. Payment, financial compliance, conditional offers, document-request workflows, course-level applications, and an in-app notification centre remain Sprint 3 proposals until stakeholder approval.

## 2. User Classes

- **Applicant:** registers, verifies identity, creates an application, uploads evidence, and tracks status.
- **Admissions officer:** reviews only applications belonging to the officer's university and records decisions.
- **Compliance officer:** proposed Sprint 3 role for financial-evidence review.
- **Project team/administrator:** operates deployment, evidence, and support processes; this is not automatically an application role.

## 3. Functional Requirements

| ID | Requirement | Source story | Sprint status |
|---|---|---|---|
| FR-01 | The system shall allow an applicant to register with email, password, and full name. | US-01 | Sprint 2 |
| FR-02 | The system shall send an email-verification action and restrict the protected journey until verification. | US-01 | Sprint 2 |
| FR-03 | The system shall allow an applicant to log in, log out, and request a password reset. | US-01 | Sprint 2 |
| FR-04 | The system shall store an applicant profile with a controlled role. | US-01, US-02 | Sprint 2 |
| FR-05 | The system shall display available university reference data to an authenticated applicant. | US-03 | Sprint 2 |
| FR-06 | The system shall allow an applicant to create and submit an application. | US-04 | Sprint 2 |
| FR-07 | The system shall display the authenticated applicant's applications and current statuses. | US-05 | Sprint 2 |
| FR-08 | The system shall accept one PDF, JPG, or PNG document of no more than 10 MB for an application. | US-06 | Sprint 2 |
| FR-09 | The system shall allow an admissions officer to list applications for the officer's assigned university. | US-07 | Sprint 2 |
| FR-10 | The system shall allow an admissions officer to view an application's submitted data and document metadata. | US-08 | Sprint 2 |
| FR-11 | The system shall allow an admissions officer to record an offer or rejection with a message. | US-09 | Sprint 2 |
| FR-12 | The system shall preserve an append-only decision history. | US-09 | Sprint 2 |
| FR-13 | The system shall send relevant verification and decision emails and record appropriate delivery evidence. | US-10 | Sprint 2 |
| FR-14 | The system shall allow an applicant to select a course belonging to a university. | US-11 | Proposed Sprint 3 |
| FR-15 | The system shall support additional-document requests and their requested/received/verified lifecycle. | US-12, US-13 | Proposed Sprint 3 |
| FR-16 | The system shall record an application-fee payment and its lifecycle. | US-14 | Proposed Sprint 3 |
| FR-17 | The system shall allow an authorised compliance officer to record a finance check. | US-15 | Proposed Sprint 3 |
| FR-18 | The system shall distinguish conditional and unconditional offers and record conditions. | US-16 | Proposed Sprint 3 |
| FR-19 | The system shall provide an applicant notification centre with read/unread state. | US-17 | Proposed Sprint 3 |

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

## 5. Business Rules

- Unverified applicants cannot proceed through the protected application journey.
- Applicant-created profiles use the applicant/student role; privileged roles are not self-assigned.
- University reference data is client read-only in Sprint 2.
- Applications follow the approved status lifecycle documented in the schema.
- Decision history is append-only.
- Sprint 3 proposal records do not become implementation commitments without stakeholder validation.

## 6. External Interfaces

- Firebase Authentication for identity and email actions.
- Firestore for application data and security scoping.
- Firebase Storage for application documents.
- Vercel for preview and stable deployments.
- Selected email provider for decision email delivery.

## 7. Assumptions and Open Decisions

Open decisions are maintained in `docs/issues-and-open-questions.md`. The evolved Sprint 3 ERD must answer course/intake rules, payment simulation versus live processing, compliance data retention, structured conditional-offer conditions, and notification/email delivery semantics before implementation.
