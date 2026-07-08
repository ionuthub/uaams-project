# Schema Documentation

This document tracks the Sprint 2 Firestore schema. It is a working draft and should be updated as Dawid and Cornel finalise the data model.

## Proposed Collections

| Collection | Purpose |
|---|---|
| `users` | Stores user profile data, role, university scope, and authentication metadata references |
| `universities` | Stores university records used for admin scoping |
| `applications` | Stores each student application, current status, submitted fields, and owner references |
| `documents` | Stores document metadata linked to Firebase Storage paths |
| `decisions` | Stores offer/reject decisions, admin message, timestamp, and audit information |
| `messages` | Stores user-facing messages related to application decisions |
| `emailLogs` | Stores email send attempts, provider response metadata, and delivery status where appropriate |

## Status Values

Suggested Sprint 2 application statuses:

- `draft`
- `submitted`
- `under_review`
- `offered`
- `rejected`

## Required Schema Decisions

- Required fields for each collection.
- Firestore indexes needed for admin list views.
- University scoping model for admins.
- Storage path convention for uploaded documents.
- Whether decision changes are allowed after submission.
- Email log retention and deletion behaviour.
