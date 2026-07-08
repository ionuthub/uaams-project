# Test Plan

## Sprint 2 Acceptance Path

The weekly smoke test should prove that:

1. A student can register.
2. The student can verify their email.
3. The student can log in and reset their password.
4. The student can submit an application with one document.
5. An admin can view the submitted application for their university.
6. The admin can offer or reject with a custom message.
7. The student receives the decision email.
8. The student dashboard status updates correctly.

## Evidence Required

- Screenshot or short demo of student registration and login.
- Screenshot or short demo of email verification.
- Screenshot or short demo of application submission.
- Screenshot or short demo of document upload.
- Screenshot or short demo of admin list and detail views.
- Screenshot or short demo of offer/reject decision.
- Screenshot or short demo of decision email and status update.

## Weekly Smoke Test

Cornel owns the weekly smoke test, integration checks, and demo-path testing. Results should be added to the Sprint 2 report with the date, build URL, tested path, pass/fail result, and evidence link.

## Priority Checks

- No secrets are committed.
- Live build loads successfully.
- Authentication works on the live URL.
- Firestore data is scoped correctly by university.
- Storage upload and document access follow the chosen security model.
- Decision emails are sent to the correct student.
