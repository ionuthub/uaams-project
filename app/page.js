"use client";

// app/page.js : BACKEND TEST SCAFFOLD (Dawid's lane).
// Deliberately ugly and unstyled: this page exists so the backend can be
// proven working end to end BEFORE Elena's real screens land. It walks the
// exact Sprint 2 demo path: register -> verify -> apply + upload ->
// admin sees it scoped -> decision -> student sees status.
// Elena replaces this page; the lib/ functions underneath stay the same.

import { useState, useEffect } from "react";
import {
  registerStudent,
  login,
  logout,
  resendVerification,
  watchAuth,
  getUserProfile,
} from "../lib/auth";
import {
  getUniversities,
  createApplication,
  submitApplication,
  getStudentApplications,
  getApplicationsForUniversity,
  recordDecision,
} from "../lib/db";
import { uploadDocument, validateFile } from "../lib/storage";
import { getAuthClient } from "../lib/firebase";

export default function Harness() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [log, setLog] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [universities, setUniversities] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [adminApps, setAdminApps] = useState([]);
  const [file, setFile] = useState(null);

  const say = (msg) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l]);

  useEffect(() => {
    try {
      const unsub = watchAuth(async (u) => {
        setUser(u);
        if (u) {
          const p = await getUserProfile(u.uid);
          setProfile(p);
          say(`Signed in as ${u.email} (verified: ${u.emailVerified}, role: ${p?.role})`);
        } else {
          setProfile(null);
        }
      });
      return unsub;
    } catch (error) {
      say(`SETUP REQUIRED: ${error.message}`);
      return undefined;
    }
  }, []);

  const run = (label, fn) => async () => {
    try {
      await fn();
      say(`OK: ${label}`);
    } catch (e) {
      say(`ERROR in ${label}: ${e.code ? e.code + " - " : ""}${e.message}`);
    }
  };

  return (
    <main>
      <h1>UAAMS backend test harness</h1>
      <p>Unstyled on purpose. Proves the Sprint 2 demo path against live Firebase.</p>

      <h2>1. Auth</h2>
      <input placeholder="full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <br />
      <button onClick={run("register + verification email sent", () => registerStudent(email, password, name))}>
        Register student
      </button>
      <button onClick={run("login", async () => { const { verified } = await login(email, password);
            if (!verified) say("Signed in but NOT verified. Click the link in your email, then press Login again.");
          })}>Login</button>
      <button onClick={run("resend verification", () => resendVerification(getAuthClient().currentUser))}>
        Resend verification
      </button>
      <button onClick={run("logout", logout)}>Logout</button>
      <p>Current: {user ? `${user.email} | verified: ${String(user.emailVerified)} | role: ${profile?.role}` : "signed out"}</p>

      <h2>2. Student: apply + upload</h2>
      <button onClick={run("load universities", async () => setUniversities(await getUniversities()))}>
        Load universities
      </button>
      {universities.map((u) => (
        <button
          key={u.id}
          onClick={run(`create draft application to ${u.name}`, async () => {
            const id = await createApplication(user.uid, u.id, { step1: "sample", step4: "sample" });
            say(`Draft created: ${id}`);
          })}
        >
          Apply to {u.name}
        </button>
      ))}
      <br />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button
        onClick={run("validate + upload to newest draft", async () => {
          const problem = validateFile(file);
          if (problem) throw new Error(problem); // IS-07 check
          const apps = await getStudentApplications(user.uid);
          const draft = apps.find((a) => a.status === "draft");
          if (!draft) throw new Error("NO_DRAFT");
          await uploadDocument(draft.id, file);
        })}
      >
        Upload document (10MB, PDF/JPG/PNG : IS-07)
      </button>
      <button
        onClick={run("submit newest draft", async () => {
          const apps = await getStudentApplications(user.uid);
          const draft = apps.find((a) => a.status === "draft");
          if (!draft) throw new Error("NO_DRAFT");
          await submitApplication(draft.id);
        })}
      >
        Submit application
      </button>
      <button onClick={run("refresh my applications", async () => setMyApps(await getStudentApplications(user.uid)))}>
        Refresh my applications
      </button>
      <ul>
        {myApps.map((a) => (
          <li key={a.id}>
            {a.id} | <b>{a.status}</b> | doc: {a.documentPath || "none"} | message: {a.latestDecisionMessage || "—"}
          </li>
        ))}
      </ul>

      <h2>3. Admin: scoped queue + decision (login as the seeded admin first)</h2>
      <button
        onClick={run("load my university's applications", async () =>
          setAdminApps(await getApplicationsForUniversity(profile.universityId))
        )}
      >
        Load applications for my university
      </button>
      <ul>
        {adminApps.map((a) => (
          <li key={a.id}>
            {a.id} | {a.status} | student {a.studentUid}
            <button onClick={run("offer", () => recordDecision(a.id, user.uid, "offer", "Congratulations! (test message)"))}>
              Offer
            </button>
            <button onClick={run("reject", () => recordDecision(a.id, user.uid, "rejected", "Unfortunately... (test message)"))}>
              Reject
            </button>
          </li>
        ))}
      </ul>

      <h2>Log</h2>
      <pre>{log.join("\n")}</pre>
    </main>
  );
}
