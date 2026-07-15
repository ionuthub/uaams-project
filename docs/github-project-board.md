# GitHub Project Board

Use the GitHub Project as the live Product and Sprint Backlog with these workflow states:

```text
Product Backlog
Ready
In Progress
In Review
Blocked
Done
```

Recommended fields:

- `Epic` (`EP-01` to `EP-08`).
- `Item Type` (`Epic`, `User Story`, `Delivery Task`, `Enabler`, `Bug`).
- `Story References` (supports more than one ID where necessary).
- `Requirement References` (FR/NFR IDs).
- `Sprint Week`.
- `Priority` (`Must`, `Should`, `Could`).
- `Delivery Owner` (team-facing accountability, including members without assignable GitHub accounts).
- GitHub `Assignees` (account-level responsibility where available).
- `Status`.

Story points are optional and should be introduced only if the team estimates together and uses the values during planning. Do not add unused fields merely to imitate a framework.

Every selected story must have:

- Owner.
- Done-when line.
- Evidence required.
- Report section affected.

Use the project board to track Sprint 2 work from backlog through review and completion. Move blocked work to `Blocked` and add a blocker issue when a decision is needed.

## Milestone Policy

- Week 1: foundations and completed historical evidence.
- Week 2: core identity, applicant, document, and initial admissions views, including explicit carry-over.
- Week 3: integrated scoping, decisions, and email workflow.
- Week 4: final smoke testing, report evidence, release, and review.
- Sprint 3 proposal: evolved ERD stories awaiting client validation.

Unfinished work moved from one milestone to another receives `status:carry-over` and an issue comment explaining why. Completed history is never rewritten.

## Project Scope Rule

Payments, financial compliance, conditional offers, additional-document requests, course-level applications, and the notification centre remain Product Backlog proposals until stakeholder approval. They must not appear as Week 2 commitments merely because they are present in a proposed ERD.
