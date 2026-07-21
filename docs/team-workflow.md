# Team Workflow

## Agile Delivery Model

UAAMS treats Sprint 2 as one four-week Sprint with weekly planning and review checkpoints. It uses one ordered Product Backlog. Epics group long-lived product capabilities; user stories express stakeholder value; technical tasks describe how the team delivers a selected story.

Week 1 to Week 4 are checkpoints inside Sprint 2, not separate Sprints.

The delivery chain is:

```text
PRD -> Product Goal -> Epic -> User Story -> FR/NFR -> Task/PR -> Test -> Evidence
```

The original PRD is the product baseline. Sprint Planning selects an increment from that baseline; it does not silently delete unselected requirements. Proposed additions and technical substitutions use the change-control rule in `docs/prd-compliance-register.md` and the decision format in `docs/prd-change-request-template.md`.

Canonical user stories have their own GitHub issues. Existing frontend, backend, email, testing and documentation issues are delivery tasks or enablers linked beneath those stories. A delivery task may support multiple stories but has one primary parent for board clarity.

### Sprint 2 Week 2 Goal

By the end of Week 2, a verified applicant can log in, view the dashboard, enter the required application information, and upload one permitted document, while an admissions officer can view the application list. (Opening application details - US-08/#13 - was re-planned to Week 3 on 15 July.)

### Weekly Events

- **Sprint Planning:** agree the Sprint Goal, select ready stories, confirm owners and dependencies.
- **Daily Scrum:** inspect progress toward the goal, state the next action, and expose blockers.
- **Backlog refinement:** clarify proposed stories and acceptance criteria without silently adding them to the Sprint.
- **Sprint Review:** demonstrate the integrated increment and collect stakeholder feedback.
- **Retrospective:** record one owned improvement for the next week.

### Work-in-Progress Rule

Each person has at most one primary item in `In Progress`. Support work may be linked, but starting more work does not take priority over finishing the Sprint Goal.

## Definition of Ready

A story can enter a Sprint when it has an epic, user story, business value, PRD/FR/NFR references, testable acceptance criteria (including the repeat, resume, and missing-input cases for any state-changing action), owner, dependency decision, and evidence requirement. If it changes or adds to the PRD, approval evidence must already exist or the item remains refinement-only.

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
6. Link the affected PRD requirement or approved change.
7. Add screenshots, logs, or demo evidence when the task affects the live proof of concept.
8. Keep the pull request small enough to review.

## Review Process

- No direct commits to `main`.
- No feature branch is merged without a pull request.
- Ionut coordinates pull request reviews.
- The reviewer checks that the work matches the issue, does not include secrets, and has enough evidence.
- If a pull request affects another team member's area, request their review before merging.

## Engineering Standards For State-Changing Code

Most defects in this project have been missing failure cases, not wrong happy-path code. Before writing any function that creates, saves, uploads or otherwise changes state, answer three questions in the pull request description:

- What happens if this runs twice?
- What happens if the resource already exists?
- What happens if a dependency (env var, network, file) is missing?

If the answer to any of these is "I do not know", that is the bug waiting to happen. Resolve it before merging. The rules that follow from this:

- Design the read path before the write path. On load, check for existing data first; a feature that only ever creates will produce duplicates.
- Never write a fallback value for required config (API keys, project IDs, URLs). Throw immediately with a clear error naming what is missing. The `appUrl()` helper in `lib/auth.js` and the config check in `lib/firebase.js` are the house style.
- Treat "the UI says success" as a claim that must be true. Show a success state only after the write is confirmed, never because the handler ran.

## Definition of Done

Done means:

- The pull request is merged.
- The change is deployed or included in the latest live build.
- The relevant Sprint 2 report section is updated.
- The demo path still passes a smoke test.
- Evidence is attached to the issue, pull request, or report.
- The user story and FR/NFR references are updated in the traceability matrix.
- The PRD compliance register is updated with the new status and evidence.
- Any deviation, substitution or added scope has recorded approval.
- Acceptance criteria and relevant allowed/blocked access cases pass.
- For state-changing features, the repeat-action, resume and missing-dependency cases are handled, not just the happy path.

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

## Repository Safeguards

- GitHub Actions runs repository integrity checks and a production build on pull requests and pushes to `develop` and `main`.
- Vercel supplies preview and production deployment checks.
- The private repository's current GitHub plan does not permit branch protection or repository rulesets. Until that changes, the team must enforce pull-request review and passing checks through process.
- Merge commits are the only enabled merge strategy so full feature history is preserved.
- Merged head branches are deleted automatically.
