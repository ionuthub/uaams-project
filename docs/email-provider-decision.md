# Email Provider Decision

**Issue:** #16 - Compare email providers and choose one

**Decision date:** 15 July 2026

**Original owner:** Sorin

**Completed by:** Ionut, as Sprint 2 Week 1 catch-up work

## Decision

Use **Resend** for UAAMS decision emails and delivery logging.

Firebase Authentication remains responsible for email-verification and password-reset emails. Resend will be introduced in issue #17 for application decision emails sent after an admin records an offer or rejection. Keeping these responsibilities separate avoids rebuilding Firebase's authentication security flow.

The preferred integration is the **Resend HTTPS API from server-side Next.js code**. Resend also supports SMTP, but the API gives the application a provider message ID and structured errors that can be recorded in `emailLogs`.

## Requirements

The Sprint 2 provider must:

- send transactional offer and rejection emails;
- work from a Next.js application deployed on Vercel;
- provide API or SMTP access on a free or low-cost plan;
- support an authenticated sender domain;
- keep credentials on the server and outside Git;
- return enough information to record send attempts and failures;
- support the small volume required for the proof of concept.

## Provider Comparison

Limits and prices were checked against provider documentation on 15 July 2026. They must be checked again before any paid commitment.

| Provider | Free allowance | API / SMTP | Sender setup | Vercel and Next.js fit | Main trade-off |
|---|---|---|---|---|---|
| **Resend** | 3,000 emails/month, with a 100 emails/day limit | REST API, Node SDK and SMTP relay | Verify an owned domain using SPF and DKIM; one domain on the free plan | Native Vercel Marketplace integration can create `RESEND_API_KEY`; official Next.js examples are available | Best fit for this proof of concept, but live sending to team test addresses requires a domain the team controls |
| **Brevo** | 300 emails/day on the Free plan | Transactional REST API and SMTP relay | Register a sender and authenticate an owned domain using Brevo code, DKIM and DMARC | Works from Vercel through HTTPS or SMTP, but setup and product surface are broader than UAAMS needs | Higher daily allowance, but more configuration and account approval may be involved |
| **Postmark** | 100 emails/month on the free Developer tier; Basic starts at $15/month for 10,000 emails | REST API, official SDKs and SMTP | Confirm a sender signature or verify a domain; DKIM and Return-Path are recommended | Straightforward server-side integration and strong transactional-email focus | Good service, but the free allowance is much smaller than Resend or Brevo |

## Why Resend

Resend is selected because:

1. It is designed for transactional email and has a simple Node/Next.js API.
2. Its free allowance is sufficient for the Sprint 2 demonstration and testing.
3. It has a native Vercel integration and can provision `RESEND_API_KEY` as a server-side environment variable.
4. It supports both API and SMTP, so the team is not locked into one transport.
5. It returns a message ID and supports webhooks, which fits the planned `emailLogs` collection.
6. It does not require production approval before sending, although sender-domain verification is still required.

## Access Decision and Blocker

The team needs access to an **owned domain or subdomain and its DNS settings** before Resend can send live UAAMS emails to arbitrary student addresses. A `vercel.app` subdomain cannot be treated as a team-owned sending domain.

For development, Resend's test sender may be used only within its testing restrictions. It is not evidence that live decision email works for other recipients.

**Owner for resolving access:** Ionut

**Needed decision:** identify the team-controlled domain/subdomain and the person who can add the Resend SPF and DKIM records.

**Fallback:** if the team cannot obtain DNS access, review Brevo sender verification before implementing issue #17. Do not silently switch providers.

## Environment Variables

Add these variables to `.env.local` and Vercel Preview/Production settings. Never add their real values to Git.

| Variable | Secret | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Yes | Server-side Resend authentication |
| `EMAIL_FROM` | No | Verified sender, for example `UAAMS <decisions@updates.example.org>` |
| `EMAIL_REPLY_TO` | No | Monitored reply address, if the team has one |
| `RESEND_WEBHOOK_SECRET` | Yes | Optional verification secret if delivery webhooks are added |

None of these variables should use the `NEXT_PUBLIC_` prefix. Email sending must never run in a browser component.

## Setup Checklist for Issue #17

- [ ] Create the team Resend account and record who controls it.
- [ ] Add a dedicated sending subdomain, such as `updates.example.org`.
- [ ] Add the SPF and DKIM records supplied by Resend.
- [ ] Wait until the domain status is `verified`.
- [ ] Create a sending-only API key.
- [ ] Add `RESEND_API_KEY` to Vercel Preview and Production environments.
- [ ] Add `EMAIL_FROM` and, if available, `EMAIL_REPLY_TO`.
- [ ] Install the Resend Node package in the email-system feature branch.
- [ ] Implement a server-side send function; never expose the API key to client code.
- [ ] Send a test message to at least two team-controlled addresses.
- [ ] Record provider message ID, type, application ID, status and timestamp in `emailLogs`.
- [ ] Record a failed attempt without exposing the API key or full provider payload.
- [ ] Add an idempotency key so retrying a decision does not send duplicate emails.

## Integration Contract

Issue #17 should add a protected server-side endpoint with a browser-facing contract similar to:

```text
POST /api/email/decision
Authorization: Bearer <Firebase ID token>
Body: { applicationId }
```

The endpoint must:

- verify the Firebase ID token, admin role and university scope on the server;
- read the application, latest decision and student's email from Firestore after `recordDecision()` succeeds;
- never trust a browser-supplied recipient, decision or message;
- accept only a committed `offer` or `rejected` decision;
- send from the configured `EMAIL_FROM` address;
- include the decision and admin message in both HTML and plain text;
- return the Resend message ID on success;
- write a success or failure record to `emailLogs`;
- avoid logging the API key or unnecessary personal data;
- surface failure to the admin flow instead of showing a false success.

The decision email should be triggered only after `recordDecision()` completes successfully. If email sending fails, the recorded application decision must remain visible and the failure must be available for retry.

## Compatibility with Dawid's Firebase Backend

This design was checked against the current `develop` versions of `lib/auth.js`, `lib/db.js`, `lib/firebase.js`, `firestore.rules` and `package.json`.

- Firebase Authentication continues to own verification and password-reset emails. Resend does not replace the functions in `lib/auth.js`.
- `recordDecision()` already commits the application status and an append-only decision record in one Firestore batch. The email request runs only after that batch succeeds.
- The implemented status values are `offer` and `rejected`. The email module must use those exact values.
- The current Firebase client uses `getAuthClient()` and `getDbClient()` lazy getters. New email code must keep that interface and must not import removed `auth` or `db` constants.
- Resend and Firebase Admin must be used only in a Next.js server route or other server-only module. If the production route imports `firebase-admin`, move that package from `devDependencies` to `dependencies`.
- The server should write `emailLogs` through Firebase Admin after verifying the caller and application scope. When that route is implemented, client creation of `emailLogs` in `firestore.rules` should be denied because Admin SDK writes do not depend on client rules.
- Dawid's separate `/auth/action` branch work concerns Firebase email-action links and is not a dependency of the Resend decision-email flow. The merged `/verify-email` and `/reset-password` routes remain the current integration point unless the team reviews and merges a replacement.

## Security and Data Handling

- Keep the API key in Vercel and `.env.local`, never in source code or screenshots.
- Use a sending-only key rather than an unrestricted account key where possible.
- Store the minimum email-log data needed for evidence and support.
- Do not store email bodies or provider credentials in Firestore.
- Do not claim delivery from an API `accepted` response; delivery requires provider event evidence or confirmation from the receiving mailbox.
- Keep email-log retention marked as unresolved until issue IS-06 is decided.

## Evidence Needed to Complete Integration

- Resend account and verified-domain screenshot with sensitive values hidden.
- Successful Vercel Preview deployment.
- Offer and rejection emails received by test accounts.
- Matching `emailLogs` records with provider message IDs.
- One controlled failure showing an honest failed state and no secret exposure.

## Official Sources

- [Resend pricing](https://resend.com/pricing)
- [Resend free-tier allowance](https://resend.com/blog/new-free-tier)
- [Resend SMTP credentials](https://resend.com/docs/send-with-smtp)
- [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction)
- [Resend for Vercel](https://vercel.com/marketplace/resend)
- [Resend Next.js integration](https://resend.com/nextjs)
- [Brevo free-plan limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan)
- [Brevo transactional email API](https://developers.brevo.com/docs/send-a-transactional-email)
- [Brevo domain authentication](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC)
- [Postmark pricing](https://postmarkapp.com/pricing)
- [Postmark sender signatures](https://postmarkapp.com/developer/user-guide/managing-your-account/managing-sender-signatures)
