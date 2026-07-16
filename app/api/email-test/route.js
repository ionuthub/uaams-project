// app/api/email-test/route.js
// POST /api/email-test - the smallest controlled test sender for issue #17.
//
// Purpose: prove the Resend connection end to end (EMAIL-01 preparation)
// without building the full decision-email path (#19, Week 3).
//
// Safety rules:
// - The route is disabled unless the server-only env var ENABLE_EMAIL_TEST
//   is exactly "true" (same pattern as the /dev/harness gate).
// - The recipient is fixed by the server-only EMAIL_TEST_RECIPIENT env var.
//   The request body is never trusted for addressing, matching the email
//   rules in docs/architecture-overview.md.
// - Responses and logs never contain the API key or a full email body.

import { NextResponse } from "next/server";
import { sendEmail } from "../../../lib/email";

export async function POST() {
  if (process.env.ENABLE_EMAIL_TEST !== "true") {
    // Behave like a missing route when the test sender is not enabled.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const to = process.env.EMAIL_TEST_RECIPIENT;
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "email/missing-test-recipient" },
      { status: 500 }
    );
  }

  try {
    const { providerId } = await sendEmail({
      to,
      subject: "UAAMS email connection test (#17)",
      text:
        "This is the controlled UAAMS test email for issue #17. " +
        "If you received it, the Resend connection and sender identity work. " +
        "Sent at " + new Date().toISOString() + ".",
    });

    console.log("[email-test] sent ok, provider id:", providerId);
    return NextResponse.json({ ok: true, providerId });
  } catch (error) {
    console.error("[email-test] send failed:", error.code || error.message);
    return NextResponse.json(
      {
        ok: false,
        error: error.code || "email/send-failed",
        providerStatus: error.providerStatus || null,
      },
      { status: 502 }
    );
  }
}
