# UAAMS - University Administration and Application Management System

UAAMS is a university team project for managing student applications, university-scoped administration, decision messaging, and application status updates.

## Start Here

- **Live application:** https://uaams-project.vercel.app
- **Sprint board:** https://github.com/users/ionuthub/projects/3
- **Team operating guide:** https://github.com/ionuthub/uaams-project/issues/30
- **Current delivery branch:** `develop`
- **Stable release branch:** `main`
- **Current milestone:** Sprint 2 - Week 2: Core Increment

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
- Resend transactional email service

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

## Run Locally

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Ask the Firebase owner for the local values and place them only in `.env.local`.
Never commit `.env.local` or `serviceAccountKey.json`.

Open http://localhost:3000 after the development server starts.

## Agile and Requirements Documentation

- `docs/prd-compliance-register.md` — original PRD baseline, implementation status, deviations and corrective actions.
- `docs/prd-change-request-template.md` — approval record for removing, substituting or adding PRD scope.
- `docs/user-stories.md` — Product Backlog story catalogue and epic mapping.
- `docs/software-requirements-specification.md` — Sprint 2 FR/NFR and proposed Sprint 3 requirements.
- `docs/requirements-traceability-matrix.md` — story-to-requirement-to-issue-to-test evidence for selected Agile work.
- `docs/team-workflow.md` — Scrum cadence, Definition of Ready, and Definition of Done.

The original PRD remains the product baseline. A reduced sprint increment does not remove unselected PRD requirements. Proposed additions—especially payments and new roles—require an approved change before implementation.

## Repository Layout

```text
app/         Next.js routes and route-level UI
components/  Shared user-interface components
lib/         Firebase, authentication, database, storage, and validation helpers
scripts/     Local seed and maintenance scripts
docs/        Product, Sprint, architecture, schema, testing, and workflow documents
.github/     Pull request, issue, and automation configuration
```

## Current Product State

- Registration, login, verification guidance, and password-reset screens are implemented.
- Firebase authentication, Firestore helpers, rules, and the demo backend path are present.
- The student dashboard, application form, production upload flow, admin screens, and final decision-email UI connection remain active Sprint work. The protected decision-email backend and logging are implemented on the issue #19 branch.
- The root page is the public product entry page. The backend test harness is available only at `/dev/harness` when the server-only `ENABLE_TEST_HARNESS=true` variable is set locally.

Use the issue board and milestone status as the source of truth; documentation must not describe planned work as implemented.
