# Data retention and erasure policy

Issue #233, PRD-NFR-08. Defines what UAAMS keeps, what it erases on request, and how a request is actioned. One page on purpose.

## What we hold, and for how long

| Data | Where | Retention |
|---|---|---|
| Applicant identity (name, DOB, passport number, address, phone) | application form fields, user profile | Until erasure is requested |
| Uploaded documents (passport copy, transcripts, certificates) | Firebase Storage | Until erasure is requested |
| Personal statement and qualification history | application form fields | Until erasure is requested |
| Application lifecycle (status, dates, university, course) | application record | Retained indefinitely, pseudonymously after erasure |
| Decision history (decision, message, deciding officer, timestamp) | decisions subcollection, append-only | Retained indefinitely - institutional record |
| Internal notes | notes subcollection | Retained; author is staff, subject references become pseudonymous after erasure |
| Email send records | emailLogs | Retained for audit; contain addresses, reviewed on erasure |
| Notifications | notifications | Deleted on erasure - they reference the person directly |
| Erasure log | erasureLog | Records THAT an erasure happened and which references; never who |

## The design position

Erasure is implemented as **anonymisation, not deletion**. #193 proved that records cannot be deleted by any client, and the decision history is append-only by design. Destroying decision records to fulfil an erasure request would destroy the institution audit trail - the thing the platform exists to provide. Instead, everything that identifies the person is stripped or destroyed, and the institutional record survives against a pseudonymous application reference. This mirrors sector practice: an admissions decision must remain accountable even after the applicant exercises their rights.

## How a request is actioned

1. A request arrives through any contact route. It is logged with the date.
2. A team member verifies the requester controls the account email address.
3. An operator holding the service account key runs `scripts/anonymise-applicant.mjs --email <address>` as a dry run, reviews the plan, then re-runs with `--confirm`.
4. The erasure log entry is the completion record. Target: within one calendar month of the verified request, per UK GDPR Article 12(3).

Erasure is deliberately not self-service: it is an operator action with legal weight, gated by the service account key, matching the provisioning decision recorded on #195.

## What erasure does not remove

The pseudonymous application skeleton (status, dates, university, course), the decision history, and the erasure log entry itself. This is stated to the requester when their request is confirmed.

## Out of scope for the proof of concept

Automated retention expiry (for example, erasing unsuccessful applications after n years), subject access requests (data export), and backup handling. Each is recorded here rather than silently omitted.
