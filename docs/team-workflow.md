# Team Workflow

## Branch Naming Convention

Use short feature branches that describe the work area:

- `feature/firebase-setup`
- `feature/student-auth`
- `feature/admin-dashboard`
- `feature/email-system`
- `feature/test-plan`
- `feature/design-docs`

Use `feature/<short-task-name>` for additional tasks.

## Pull Request Process

1. Create or pick up a GitHub issue.
2. Create a feature branch from `develop`.
3. Commit only related work for that task.
4. Open a pull request into `develop`.
5. Link the issue in the pull request.
6. Add screenshots, logs, or demo evidence when the task affects the live proof of concept.
7. Keep the pull request small enough to review.

## Review Process

- No direct commits to `main`.
- No feature branch is merged without a pull request.
- Ionut coordinates pull request reviews.
- The reviewer checks that the work matches the issue, does not include secrets, and has enough evidence.
- If a pull request affects another team member's area, request their review before merging.

## Definition of Done

Done means:

- The pull request is merged.
- The change is deployed or included in the latest live build.
- The relevant Sprint 2 report section is updated.
- The demo path still passes a smoke test.
- Evidence is attached to the issue, pull request, or report.

Working locally is not enough.

## Blockers

Report blockers early using the blocker issue template.

Every blocker should include:

- What is blocked.
- Who is blocked.
- Who can unblock it.
- The decision needed.
- Deadline impact.

Move blocked tasks to the `Blocked` project column until the decision is made.
