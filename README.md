# UAAMS - University Administration and Application Management System

UAAMS is a university team project for managing student applications, university-scoped administration, decision messaging, and application status updates.

## Sprint 2 Goal

Build a live proof of concept where one student can register, verify their email, submit an application with one document, and one admin can view it, make a decision, send a message, and trigger an email/status update.

The Sprint 2 demo path is:

1. A student registers.
2. The student verifies their email.
3. The student submits an application with one document.
4. An admin views the application, scoped to their university.
5. The admin offers or rejects with a custom message.
6. The student receives the decision email and their status updates.

## Tech Stack

- Next.js / React
- Firebase Authentication
- Firestore
- Firebase Storage
- Vercel deployment
- SMTP/email provider

## Team Roles

| Team member | Main responsibilities |
|---|---|
| Ionut | GitHub workflow, repo organisation, GitHub Projects board, pull request reviews, Vercel deployment pipeline, admin module, report assembly |
| Dawid | Firebase/back-end, Firestore data model, Firebase Storage, authentication, security rules, seed data |
| Alina | Student front-end screens, registration/login UI, dashboard, form steps and upload screen |
| Sorin | Email provider decision, SMTP setup, verification and decision emails, email logging |
| Silvana | Architecture overview, schema documentation, design documentation, Sprint 3 user-testing method |
| Cornel | Test plan, integration checks, smoke testing, demo-path testing |

## Workflow Rules

- No direct commits to `main`.
- Work on feature branches such as `feature/firebase-setup`, `feature/student-auth`, `feature/admin-dashboard`, `feature/email-system`, `feature/test-plan`, and `feature/design-docs`.
- Open pull requests into `develop`.
- Merge `develop` into `main` only when the proof-of-concept path is stable.
- Done means merged, deployed, and smoke-tested, not just working locally.

## Agile and Requirements Documentation

- `docs/user-stories.md` — Product Backlog story catalogue and epic mapping.
- `docs/software-requirements-specification.md` — Sprint 2 FR/NFR and proposed Sprint 3 requirements.
- `docs/requirements-traceability-matrix.md` — story-to-requirement-to-issue-to-test evidence.
- `docs/team-workflow.md` — Scrum cadence, Definition of Ready, and Definition of Done.

## Repository Layout

```text
docs/       Sprint planning, architecture, schema, testing, and workflow notes
.github/   Pull request and issue templates
src/        Application source code placeholder
```
