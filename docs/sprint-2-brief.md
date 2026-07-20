# Sprint 2 Brief

## Proof-of-Concept Path

Sprint 2 must produce a live proof of concept that demonstrates the complete minimum application journey:

1. A student registers.
2. The student verifies their email.
3. The student submits an application with one document.
4. An admin views the application, scoped to their university.
5. The admin offers or rejects with a custom message.
6. The student receives the decision email and their status updates.

## In Scope

- Repository workflow and team delivery structure.
- Firebase project setup.
- Firebase Authentication for student registration, verification, login, password reset, and admin access.
- Firestore data model for users, universities, applications, documents, decisions, messages, and email logs.
- Firebase Storage upload path for one document per application.
- Student registration/login screens.
- Student dashboard with status badges.
- Application form steps 1 and 4.
- Admin application list and detail views.
- University scoping for admin views.
- Offer/reject decision flow with a custom message.
- SMTP/email provider selection and integration.
- Verification and decision emails.
- Test plan and weekly smoke-test evidence.
- Architecture, schema, and Sprint 2 report documentation.

## Deferred to Sprint 3

- Full application form completion beyond the Sprint 2 demo path.
- Advanced admin filtering, analytics, and bulk actions.
- Complex role management beyond the required student/admin proof of concept.
- Final production hardening, accessibility pass, and broader usability testing.
- Sprint 3 user-testing method execution.
- Extended document review workflows and multi-document handling.

## Weekly Expectation

| Week | Focus |
|---|---|
| Week 1 | Foundations: repository workflow, Firebase setup, Vercel pipeline, schema decisions, initial screens |
| Week 2 | Core increment: authentication, dashboard, application form, upload, admin list view |
| Week 3 | Integration: admin detail view (moved 15 July), university scoping, decisions, emails and status updates |
| Week 4 | Release and evidence: smoke tests, bug fixes, report completion and final demo path |

## Week 2 Sprint Goal

By the end of Week 2, a verified applicant can log in, view the dashboard, enter the required application information, and upload one permitted document, while an admissions officer can view the application list. (Opening application details - US-08/#13 - was re-planned to Week 3 on 15 July.)

## Week 2 Epic Selection

| Epic | Week 2 commitment |
|---|---|
| EP-01 Identity and access | Complete live authentication and evidence (#7, #8) |
| EP-02 Catalogue | Use current university reference data; refine course requirements only |
| EP-03 Student applications | Dashboard and application form (#9, #10) |
| EP-04 Document management | Enable Storage and connect one-document upload (#6, #11) |
| EP-07 Admissions review | Admin list view (#12); detail view (#13) re-planned to Week 3 on 15 July |
| EP-08 Notifications and email | Finalise provider decision and basic connection (#16, #17) |

EP-05 Payments and EP-06 Financial compliance remain Sprint 3 proposals. EP-07 detail view (#13/US-08, re-planned 15 July), decision completion and EP-08 decision email are Week 3 work.
