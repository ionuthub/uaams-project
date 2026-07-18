# Issues and Open Questions

## Evolved ERD / Sprint 3 Validation

The evolved ERD is a proposal derived from US-11 to US-17. It does not replace the PRD or implemented model until the following stakeholder decisions are recorded. The PRD compliance classification in `docs/prd-compliance-register.md` controls whether an item is mandatory, out of scope, or a proposed addition.

| ID | Decision required | Consequence | Owner / approver | Status |
|---|---|---|---|---|
| ERD-01 | Confirm the model and validation rules for the PRD-required course and intake selection. | `courses`, `courseId`, intake/year and duplicate-application rule | Client/supervisor | Open - requirement exists; model needs approval |
| ERD-02 | Does the client approve adding payment despite the PRD marking it out of scope? | Formal change request, provider, currency, refunds and security boundary | Client/supervisor | Out of scope until approved |
| ERD-03 | Is compliance officer a real UAAMS role? | Role permissions, finance-check workflow and sensitive-data retention | Client/supervisor | Open |
| ERD-04 | Are conditional offers required and are conditions individually trackable? | Decision/condition structure and lifecycle | Client/supervisor | Open |
| ERD-05 | Can staff request additional documents after submission? | Request, upload, verification and notification workflow | Client/supervisor | Open |
| ERD-06 | Confirm whether the PRD `notifications` collection/read state requires an in-app centre or whether an approved email-only replacement is acceptable. | Notification collection, type, link and read state, or recorded waiver | Client/supervisor | Open - original requirement remains active |
| ERD-07 | What audit and retention rules apply to documents, finance evidence, payments and email logs? | Deletion/anonymisation policy and access rules | Client/supervisor | Open |

| ID | Issue | Owner | Status |
|---|---|---|---|
| IS-01 | AE2 presentation timing contradiction | Tutor | Open - awaiting reply |
| IS-02 | Email provider choice and SMTP substitution approval | Ionut (catch-up for Sorin) | Resend selected and connection proven; record approval for HTTPS API substitution |
| IS-03 | Reuse sign-off on earlier codebase | Tutor | Open - gate for week 4 build |
| IS-04 | Signed or secured URLs for document downloads | Dawid | Rules-scoped access selected; live authorised/denied evidence remains |
| IS-05 | Decision reversibility and how it is logged | Team | Append-only decision history implemented; integrated evidence remains |
| IS-06 | Email logs after GDPR deletion: anonymise or delete | Tutor / sponsor | Open - raise at Sprint 2 presentation |
| IS-07 | Upload limits: 10 MB; PDF, JPG, PNG | Team | Confirmed for Sprint 2; verify with upload tests |
