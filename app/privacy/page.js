"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/portal/PortalShell";
import { watchAuth } from "../../lib/auth";

function PrivacyContent() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px", lineHeight: 1.65 }}>
      <h1>UAAMS privacy notice</h1>
      <p>UAAMS is a university application proof of concept. It collects account, contact, academic, application and supporting-document information so an authorised university admissions officer can review an application and record a decision.</p>
      <h2>How information is used</h2>
      <p>Information is used only to provide the application workflow, protect role-based access, communicate important account or decision events, and demonstrate the agreed university project requirements.</p>
      <h2>Access and storage</h2>
      <p>Firebase Authentication, Firestore and Cloud Storage hold the proof-of-concept data. Applicants can access their own records. Admissions officers can access only applications associated with their assigned university.</p>
      <h2>Your choices</h2>
      <p>Do not submit real sensitive evidence during development testing. Requests to correct or remove test data should be sent to the UAAMS team. The production-ready retention and deletion process must be approved before real-world use.</p>
      <h2>Requesting your data or its deletion</h2>
      <p>
        You can ask what personal data this service holds about you, ask for it to be
        corrected, or ask for it to be erased. Send the request to the UAAMS team from
        the email address the account was registered with, so that the account can be
        identified without asking you for further personal details.
      </p>
      <p>
        Requests are answered within one month. Erasure is carried out by the UAAMS team
        rather than through a button in the application. Automated deletion is planned but
        not yet built, and a partial automated delete that left documents or email records
        behind would be worse than none, so client-side deletion is refused by the security
        rules until the full process exists.
      </p>
      <p>
        When an account is erased, the account record, any applications submitted from it and
        any uploaded documents are removed. Records of admissions decisions may be kept in an
        anonymised form, with the applicant no longer identifiable, because a university needs
        to be able to show how a decision was reached. Email delivery logs are anonymised
        rather than deleted, so that a record that contact took place remains without holding
        the address it was sent to.
      </p>
      <p><a href="/register">Return to registration</a></p>
    </div>
  );
}

export default function PrivacyPage() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = watchAuth((current) => {
      setUser(current);
      setReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Signed-in applicants see the notice inside the portal shell; public visitors
  // (for example arriving from registration) see the plain notice with no portal chrome.
  if (ready && user) {
    return (
      <PortalShell user={user} current="privacy">
        <PrivacyContent />
      </PortalShell>
    );
  }
  return (
    <main>
      <PrivacyContent />
    </main>
  );
}
