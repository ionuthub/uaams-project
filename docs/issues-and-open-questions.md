# Issues and Open Questions

## Evolved ERD / Sprint 3 Validation

The Sprint 3 ERD is a proposal derived from US-11 to US-17. It does not replace the implemented Sprint 2 model until the following stakeholder decisions are recorded:

| ID | Decision required | Consequence | Owner / approver | Status |
|---|---|---|---|---|
| ERD-01 | Does an applicant apply to a university or a specific course and intake? | `courses`, `courseId`, intake/year and duplicate-application rule | Client/supervisor | Open |
| ERD-02 | Is payment real, simulated, or out of scope? | Provider, currency, minor-unit amount, refunds and security boundary | Client/supervisor | Open |
| ERD-03 | Is compliance officer a real UAAMS role? | Role permissions, finance-check workflow and sensitive-data retention | Client/supervisor | Open |
| ERD-04 | Are conditional offers required and are conditions individually trackable? | Decision/condition structure and lifecycle | Client/supervisor | Open |
| ERD-05 | Can staff request additional documents after submission? | Request, upload, verification and notification workflow | Client/supervisor | Open |
| ERD-06 | Are in-app notifications required in addition to email? | Notification collection, type, link and read state | Client/supervisor | Open |
| ERD-07 | What audit and retention rules apply to documents, finance evidence, payments and email logs? | Deletion/anonymisation policy and access rules | Client/supervisor | Open |

| ID | Issue | Owner | Status |
|---|---|---|---|
| IS-01 | AE2 presentation timing contradiction | Tutor | Open - awaiting reply |
| IS-02 | Email provider choice | Sorin | Open - decision due week 4 |
| IS-03 | Reuse sign-off on earlier codebase | Tutor | Open - gate for week 4 build |
| IS-04 | Signed or secured URLs for document downloads | Dawid | Open - decide during storage setup |
| IS-05 | Decision reversibility and how it is logged | Team | Open - decide before decision flow |
| IS-06 | Email logs after GDPR deletion: anonymise or delete | Tutor / sponsor | Open - raise at Sprint 2 presentation |
| IS-07 | Upload limits: 10 MB; PDF, JPG, PNG | Team | Open - confirm week 4 |
