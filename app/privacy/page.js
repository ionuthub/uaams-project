"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/portal/PortalShell";
import { watchAuth, getUserProfile } from "../../lib/auth";

// The notice is shown to three different audiences, and the surrounding
// chrome has to match who is reading it:
//   - a public visitor arriving from registration, with no portal at all
//   - a signed-in applicant, inside the applicant portal
//   - a signed-in admissions officer, inside the admissions portal
//
// Previously every signed-in user got the applicant portal by default, so an
// admissions officer opening this page saw "My applications", "New
// application" and a panel labelled "Applicant portal". The closing link also
// always pointed at student registration, which is not where staff belong.

const STUDENT_NAV = [
  { key: "home", label: "Home", href: "/" },
  {
    key: "student-dashboard",
    label: "Dashboard",
    children: [
      { key: "dashboard", label: "My applications", href: "/student" },
      { key: "apply", label: "New application", href: "/apply" },
    ],
  },
];

const ADMIN_NAV = [
  { key: "home", label: "Home", href: "/" },
  {
    key: "admin-dashboard",
    label: "Dashboard",
    children: [{ key: "queue", label: "Application queue", href: "/admin" }],
  },
];

const FOOTER = [{ label: "Privacy", href: "/privacy" }];

function PrivacyContent({ returnHref, returnLabel }) {
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
        Requests are answered within one month. Erasure is carried out by the UAAMS team.
      </p>
      <p>
        When an account is erased, the account record, any applications submitted from it and
        any uploaded documents are removed. Records of admissions decisions may be kept in an
        anonymised form, with the applicant no longer identifiable, because a university needs
        to be able to show how a decision was reached. Email delivery logs are anonymised
        rather than deleted, so that a record that contact took place remains without holding
        the address it was sent to.
      </p>
      <p><a href={returnHref}>{returnLabel}</a></p>
    </div>
  );
}

export default function PrivacyPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = watchAuth(async (current) => {
      if (!active) return;
      setUser(current);

      if (!current) {
        setIsAdmin(false);
        setProfileName(null);
        setReady(true);
        return;
      }

      try {
        const profile = await getUserProfile(current.uid);
        if (!active) return;
        setIsAdmin(profile?.role === "admin");
        setProfileName(profile?.fullName || null);
      } catch (error) {
        // The notice must still render if the profile lookup fails; falling
        // back to the applicant view is the safer default, since it exposes
        // no admissions navigation.
        console.warn("Privacy page could not read the profile:", error.code || error.message);
        if (active) setIsAdmin(false);
      }
      if (active) setReady(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (ready && user) {
    return (
      <PortalShell
        user={{ displayName: profileName || user.displayName, email: user.email }}
        current="privacy"
        nav={isAdmin ? ADMIN_NAV : STUDENT_NAV}
        subtitle={isAdmin ? "Admissions" : "Applicant portal"}
        roleLabel={isAdmin ? "Admissions officer" : "Applicant"}
        footerLinks={FOOTER}
      >
        <PrivacyContent
          returnHref={isAdmin ? "/admin" : "/student"}
          returnLabel={isAdmin ? "Return to the application queue" : "Return to my applications"}
        />
      </PortalShell>
    );
  }

  return (
    <main>
      <PrivacyContent returnHref="/register" returnLabel="Return to registration" />
    </main>
  );
}
