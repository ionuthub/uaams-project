// Collects the full PRD 4.2.3 application content: personal details including
// passport number, academic history with institution, graduation year and grade,
// and the course applied for alongside the university and intake.
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AlertBanner from "../../components/auth/AlertBanner";
import AuthCard from "../../components/auth/AuthCard";
import FormField from "../../components/auth/FormField";
import LoadingButton from "../../components/auth/LoadingButton";
import PortalShell from "../../components/portal/PortalShell";
import { watchAuth } from "../../lib/auth";
import { createApplication, findDraftApplication, getLatestDraft, getUniversities, submitApplication, updateApplicationDraft } from "../../lib/db";
import { uploadDocument, validateFile } from "../../lib/storage";

const FIELD =
  "w-full box-border border border-border-strong rounded-md px-[0.7rem] py-[0.55rem] text-[0.9rem] text-ink bg-white focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_var(--color-blue-100)]";

const SELECT = FIELD + " select-chevron";

const TEXTAREA = FIELD + " resize-y";

const FILE_INPUT = "block w-full my-[0.8rem] mb-4";

const SECTION =
  "my-4 p-[1.4rem] border border-border rounded-[0.9rem] bg-white shadow-sm max-sm:p-4 [&>h2]:mt-0 [&>h2]:text-[1.25rem] [&>h2]:text-navy-900";

const INITIAL_FORM = { universityId: "", courseName: "", fullName: "", dateOfBirth: "", nationality: "", passportNumber: "", phone: "", address: "", previousQualification: "", institutionName: "", graduationYear: "", gpa: "", studyLevel: "", intake: "", personalStatement: "" };

const FILE_ERRORS = {
  NO_FILE: "Choose a document first.",
  FILE_TOO_LARGE: "That file is too large. Please upload a file no bigger than 10 MB.",
  INVALID_TYPE: "That file type isn't supported. Please upload a PDF, JPG, or PNG.",
};

// Every upload failure used to read the same, which hid whether the cause was
// the file, the security rules or the Firebase configuration. Keep the friendly
// wording for problems the student can fix, and carry the underlying code for
// the ones they cannot, so a report is diagnosable instead of just "try again".
function uploadError(problem) {
  const known = FILE_ERRORS[typeof problem === "string" ? problem : problem?.message];
  if (known) return known;

  const code = problem?.code;
  if (code === "storage/unauthorized") {
    return "You do not have permission to upload to this application. Sign out, sign back in and try again.";
  }
  if (code === "storage/retry-limit-exceeded" || code === "storage/canceled") {
    return "The upload did not finish. Check your connection and try again.";
  }
  return code
    ? `The document could not be uploaded (${code}). Please try again, and quote that code if you report it.`
    : "The document could not be uploaded. Please try again.";
}

export default function ApplicationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [applicationId, setApplicationId] = useState(null);
  const [file, setFile] = useState(null);
  const [documentPath, setDocumentPath] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => watchAuth(async (current) => {
    if (!current) { setPhase("signed-out"); return; }
    if (!current.emailVerified) { setPhase("unverified"); return; }
    setUser(current);
    try { setUniversities(await getUniversities()); setPhase("ready"); }
    catch (error) { console.error("University list failed:", error); setPhase("error"); return; }
    if (!hydratedRef.current) {
      try {
        const draft = await getLatestDraft(current.uid);
        if (draft) {
          hydratedRef.current = true;
          setApplicationId(draft.id);
          setForm(() => ({ ...INITIAL_FORM, ...(draft.form || {}) }));
          if (draft.documentPath) setDocumentPath(draft.documentPath);
          setMessage({ type: "info", text: "We resumed your saved draft. Review it, then keep editing or submit." });
        }
      } catch (error) { console.error("Draft resume failed:", error); }
    }
  }), []);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => { if (!current[name]) return current; const next = { ...current }; delete next[name]; return next; });
  }
  function validate() {
    const next = {};
    for (const name of ["universityId", "courseName", "fullName", "dateOfBirth", "nationality", "passportNumber", "phone", "address", "previousQualification", "institutionName", "graduationYear", "gpa", "studyLevel", "intake", "personalStatement"]) if (!String(form[name]).trim()) next[name] = "This field is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }
  async function ensureDraft() {
    if (!validate()) throw new Error("FORM_INVALID");
    const university = universities.find((item) => item.id === form.universityId);
    const formData = { ...form, universityName: university?.name || form.universityId };
    // Persist the current form on an already-known draft (no lost edits).
    if (applicationId) {
      await updateApplicationDraft(applicationId, formData);
      return applicationId;
    }
    // Resume an existing draft for this university instead of creating a duplicate.
    const existing = await findDraftApplication(user.uid, form.universityId);
    if (existing) {
      setApplicationId(existing.id);
      await updateApplicationDraft(existing.id, formData);
      return existing.id;
    }
    const id = await createApplication(user.uid, form.universityId, formData);
    setApplicationId(id);
    return id;
  }
  async function saveDraft() {
    setMessage(null); setBusy(true);
    try { const id = await ensureDraft(); setMessage({ type: "success", text: `Draft saved. Application ID: ${id}` }); }
    catch (error) { if (error.message !== "FORM_INVALID") setMessage({ type: "error", text: "The draft could not be saved. Please try again." }); }
    finally { setBusy(false); }
  }
  async function upload() {
    setMessage(null);
    const problem = validateFile(file);
    if (problem) { setMessage({ type: "error", text: uploadError(problem) }); return; }
    setBusy(true);
    try { const id = await ensureDraft(); const path = await uploadDocument(id, file); setDocumentPath(path); setMessage({ type: "success", text: "Document uploaded and linked to your draft." }); }
    catch (error) { if (error.message !== "FORM_INVALID") setMessage({ type: "error", text: uploadError(error) }); }
    finally { setBusy(false); }
  }
  async function submit() {
    setMessage(null);
    if (!documentPath) { setMessage({ type: "error", text: "Upload one permitted document before submitting." }); return; }
    setBusy(true);
    try { const id = await ensureDraft(); await submitApplication(id);
      // Confirmation email (PRD s5). Fire and forget: the submission is already
      // committed, so a send failure is logged server-side rather than shown
      // as a false submission error. The route is idempotent per application.
      try {
        const idToken = await user.getIdToken();
        fetch("/api/email/submission", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
          body: JSON.stringify({ applicationId: id }),
        }).catch((error) => console.error("Submission email dispatch failed:", error));
      } catch (error) { console.error("Submission email dispatch failed:", error); }
      setMessage({ type: "success", text: "Application submitted successfully." }); setTimeout(() => router.push("/student"), 700); }
    catch (error) { setMessage({ type: "error", text: error.message === "DOCUMENT_REQUIRED" ? "Upload a document before submitting." : "The application could not be submitted." }); }
    finally { setBusy(false); }
  }

  if (phase === "loading") return <AuthCard title="New application"><p role="status">Loading application form...</p></AuthCard>;
  if (phase === "signed-out") return <AuthCard title="New application"><AlertBanner variant="error">Sign in before starting an application.</AlertBanner><a href="/login">Go to login</a></AuthCard>;
  if (phase === "unverified") return <AuthCard title="New application"><AlertBanner variant="info">Verify your email before applying.</AlertBanner><a href="/verify-email">Verification help</a></AuthCard>;
  if (phase === "error") return <AuthCard title="New application"><AlertBanner variant="error">University information could not be loaded.</AlertBanner></AuthCard>;

  return <PortalShell user={user} current="apply"><div className="min-h-screen pt-8 px-4 pb-16 bg-transparent text-ink"><form className="max-w-[52rem] mx-auto [&>header]:mb-6 [&>header_h1]:mt-[0.2rem] [&>header_h1]:mb-2 [&>header_h1]:text-[clamp(2rem,5vw,3rem)] [&>header_h1]:text-navy-900" onSubmit={(event) => event.preventDefault()} noValidate>
    <header><p className="m-0 text-blue-600 font-extrabold uppercase tracking-[0.08em]">Student application</p><h1>Apply to a university</h1><p>Complete the required details, save a draft, attach evidence and submit.</p></header>
    {message && <AlertBanner variant={message.type}>{message.text}</AlertBanner>}
    <section className={SECTION}><h2>1. University and intake</h2><div className="flex flex-col gap-1"><label className="text-sm font-medium text-ink" htmlFor="universityId">University</label><select className={SELECT} id="universityId" value={form.universityId} onChange={(e) => update("universityId", e.target.value)} aria-invalid={!!errors.universityId}><option value="">Select a university</option>{universities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errors.universityId && <p className="text-xs font-medium text-error">{errors.universityId}</p>}</div><div className="grid grid-cols-2 gap-4 my-4 max-sm:grid-cols-1"><div className="flex flex-col gap-1"><label className="text-sm font-medium text-ink" htmlFor="studyLevel">Intended study level</label><select className={SELECT} id="studyLevel" value={form.studyLevel} onChange={(e) => update("studyLevel", e.target.value)} aria-invalid={!!errors.studyLevel}><option value="">Select a study level</option><option value="Foundation">Foundation</option><option value="Bachelors">Bachelors</option><option value="Masters">Masters</option><option value="PhD">PhD</option></select>{errors.studyLevel && <p className="text-xs font-medium text-error">{errors.studyLevel}</p>}</div><FormField label="Intake" name="intake" placeholder="e.g. September 2026" value={form.intake} onChange={(e) => update("intake", e.target.value)} error={errors.intake} /></div><FormField label="Course name" name="courseName" placeholder="e.g. BSc Computer Science" value={form.courseName} onChange={(e) => update("courseName", e.target.value)} error={errors.courseName} /></section>
    <section className={SECTION}><h2>2. Personal details</h2><div className="grid grid-cols-2 gap-4 my-4 max-sm:grid-cols-1"><FormField label="Full name" name="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} error={errors.fullName} /><FormField label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} error={errors.dateOfBirth} /><FormField label="Nationality" name="nationality" value={form.nationality} onChange={(e) => update("nationality", e.target.value)} error={errors.nationality} /><FormField label="Phone" name="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} error={errors.phone} /><FormField label="Passport number" name="passportNumber" value={form.passportNumber} onChange={(e) => update("passportNumber", e.target.value)} error={errors.passportNumber} /></div><FormField label="Address" name="address" value={form.address} onChange={(e) => update("address", e.target.value)} error={errors.address} /></section>
    <section className={SECTION}><h2>3. Academic information</h2><FormField label="Previous qualification" name="previousQualification" value={form.previousQualification} onChange={(e) => update("previousQualification", e.target.value)} error={errors.previousQualification} /><div className="grid grid-cols-3 gap-4 my-4 max-sm:grid-cols-1"><FormField label="Institution name" name="institutionName" value={form.institutionName} onChange={(e) => update("institutionName", e.target.value)} error={errors.institutionName} /><FormField label="Graduation year" name="graduationYear" placeholder="e.g. 2024" value={form.graduationYear} onChange={(e) => update("graduationYear", e.target.value)} error={errors.graduationYear} /><FormField label="GPA / Grade" name="gpa" placeholder="e.g. 2:1 or 3.6" value={form.gpa} onChange={(e) => update("gpa", e.target.value)} error={errors.gpa} /></div><div className="flex flex-col gap-1 mt-4"><label className="text-sm font-medium text-ink" htmlFor="personalStatement">Personal statement</label><textarea className={TEXTAREA} id="personalStatement" rows="7" value={form.personalStatement} onChange={(e) => update("personalStatement", e.target.value)} aria-invalid={!!errors.personalStatement} />{errors.personalStatement && <p className="text-xs font-medium text-error">{errors.personalStatement}</p>}</div></section>
    <section className={SECTION}><h2>4. Supporting document</h2><p>Upload one PDF, JPG or PNG file, no larger than 10 MB.</p><input className={FILE_INPUT} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/pjpeg,image/png" onChange={(e) => { setFile(e.target.files?.[0] || null); setDocumentPath(null); setMessage(null); }} /><LoadingButton type="button" loading={busy} onClick={upload}>Upload document</LoadingButton>{documentPath && <p className="text-success font-bold" role="status">Document attached.</p>}</section>
    <div className="flex items-center gap-3 flex-wrap mt-6 [&>a]:ml-auto max-sm:flex-col max-sm:items-stretch max-sm:[&>*]:w-full max-sm:[&>*]:text-center max-sm:[&>a]:ml-0"><LoadingButton type="button" variant="secondary" full={false} loading={busy} onClick={saveDraft}>Save draft</LoadingButton><LoadingButton type="button" variant="primary" full={false} loading={busy} onClick={submit} disabled={!documentPath}>Submit application</LoadingButton><a className="text-link" href="/student">Cancel</a></div>
  </form></div></PortalShell>;
}
