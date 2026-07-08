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
| Week 4 | Foundations: repository workflow, Firebase setup, Vercel pipeline, schema decisions, initial screens |
| Week 5 | Features on top: authentication, dashboard, application form, upload, admin views |
| Week 6 | Wire everything together: scoped admin flow, decisions, emails, status updates, smoke tests |
| Week 7 | Freeze and present: bug fixes, evidence capture, report completion, final demo path |
