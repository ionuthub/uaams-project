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
| Email system | Send verification and decision emails, record email activity | Sorin |
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
- SMTP/email provider for verification and decision messaging.
- Vercel for live deployment.

## Open Architecture Decisions

- Final email provider.
- Firestore security rule details.
- Signed or secured URL approach for document downloads.
- Decision reversibility and audit logging.
- Email log retention after GDPR deletion.
