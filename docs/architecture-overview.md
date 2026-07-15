# Architecture Overview

## Purpose

This document records the Sprint 2 architecture for the UAAMS proof of concept. It should be updated as implementation decisions are made.

## Main Modules

| Module | Responsibility | Owner |
|---|---|---|
| Student authentication | Register, verify email, log in, reset password | Dawid / Elena |
| Student dashboard | Show application status and next actions | Elena |
| Application form | Capture the Sprint 2 application fields and upload one document | Elena / Dawid |
| Admin dashboard | List and review applications scoped to the admin university | Ionut |
| Decision flow | Offer or reject with a custom message and status update | Ionut |
| Email system | Firebase Auth sends verification/reset emails; Resend will send decision emails and record email activity | Sorin (Ionut completed the Week 1 provider decision as catch-up work) |
| Data model and security | Firestore collections, rules, seed data, storage permissions | Dawid |

## Intended Flow

1. Student account is created through Firebase Authentication.
2. Student verifies their email.
3. Student submits application data to Firestore.
4. Student uploads one document to Firebase Storage.
5. Admin reads applications for their assigned university.
6. Admin records an offer or rejection with a message.
7. Application status changes in Firestore.
8. Email provider sends a decision email.
9. Evidence is captured for the Sprint 2 report.

## Integration Points

- Next.js / React front-end.
- Firebase Authentication for identity.
- Firestore for application, status, decision, and message data.
- Firebase Storage for uploaded documents.
- Firebase Authentication for verification and password-reset emails.
- Resend API, planned behind a server-side Next.js route for decision emails and email logging after issue #17 is implemented. The route must verify the Firebase ID token and university scope, then read the committed decision and recipient from Firestore.
- Vercel for live deployment.

## Open Architecture Decisions

- Resend sender-domain/DNS access before issue #17 can send live decision emails.
- Firestore security rule details.
- Signed or secured URL approach for document downloads.
- Decision reversibility and audit logging.
- Email log retention after GDPR deletion.
