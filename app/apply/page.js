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
import { uploadTypedDocument, validateFile, DOC_TYPES } from "../../lib/storage";

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

// Intakes are offered, not typed: January, May and September over the next
// three years, past months excluded. The validate() rule stays as the
// backstop for bypassed forms; drafts saved before the dropdown keep their
// free-text value selectable rather than having it silently discarded.
const INTAKE_OPTIONS = (() => {
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const OFFERED = ["January", "May", "September"];
  const now = new Date();
  const options = [];
  for (let year = now.getFullYear(); year <= now.getFullYear() + 2; year += 1) {
    for (const month of OFFERED) {
      if (year === now.getFullYear() && MONTH_NAMES.indexOf(month) < now.getMonth()) continue;
      options.push(month + " " + year);
    }
  }
  return options;
})();

export default function ApplicationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [applicationId, setApplicationId] = useState(null);
  const [files, setFiles] = useState({});
  const [documents, setDocuments] = useState({});
  const [uploadingType, setUploadingType] = useState(null);
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
          if (draft.documents) setDocuments(draft.documents);
          setMessage({ type: "info", text: "We resumed your saved draft. Review it, then keep editing or submit." });
        }
      } catch (error) { console.error("Draft resume failed:", error); }
    }
  }), []);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => { if (!current[name]) return current; const next = { ...current }; delete next[name]; return next; });
  }
  // Field-format validation (issue #178, PRD 8): every box is checked for a
  // sensible value, not just for being non-empty, and each failure explains
  // itself under the field.
  function validate() {
    const next = {};
    const val = (name) => String(form[name]).trim();
    for (const name of ["universityId", "courseName", "fullName", "dateOfBirth", "nationality", "passportNumber", "phone", "address", "previousQualification", "institutionName", "graduationYear", "gpa", "studyLevel", "intake", "personalStatement"]) {
      if (!val(name)) next[name] = "This field is required.";
    }
    const NAME_RE = /^[A-Za-zÀ-ɏ' -]+$/;
    const hasLetter = (s) => /[A-Za-zÀ-ɏ]/.test(s);
    const thisYear = new Date().getFullYear();
    if (!next.fullName && (val("fullName").length < 2 || !NAME_RE.test(val("fullName")) || !hasLetter(val("fullName")))) {
      next.fullName = "Enter your full name using letters only.";
    }
    if (!next.nationality && (val("nationality").length < 2 || !NAME_RE.test(val("nationality")) || !hasLetter(val("nationality")))) {
      next.nationality = "Enter your nationality using letters only.";
    }
    if (!next.phone) {
      const digits = val("phone").replace(/\D/g, "");
      const ukLocal = digits.length === 11 && digits.startsWith("0");
      const ukIntl = digits.length === 12 && digits.startsWith("44");
      if (!/^[+()\d\s-]+$/.test(val("phone")) || (!ukLocal && !ukIntl)) {
        next.phone = "Enter a valid UK phone number (11 digits starting 0, or +44).";
      }
    }
    if (!next.passportNumber && !/^[A-Za-z0-9-]{5,15}$/.test(val("passportNumber"))) {
      next.passportNumber = "Enter a valid passport number (5 to 15 letters and digits).";
    }
    if (!next.dateOfBirth) {
      const dob = new Date(val("dateOfBirth"));
      const year = dob.getFullYear();
      if (Number.isNaN(dob.getTime()) || year < thisYear - 100 || year > thisYear - 18) {
        next.dateOfBirth = "Enter a real date of birth (applicants must be 18 to 100 years old).";
      }
    }
    if (!next.graduationYear) {
      const year = Number(val("graduationYear"));
      if (!/^\d{4}$/.test(val("graduationYear")) || year < 1950 || year > thisYear + 1) {
        next.graduationYear = "Enter a four digit year between 1950 and " + (thisYear + 1) + ".";
      }
    }
    if (!next.gpa && val("gpa").length > 12) {
      next.gpa = "Keep the grade short, for example 2:1 or 3.6.";
    }
    // Intake must be a real month and year, and must be in the future - an
    // application is for an upcoming intake, so "September 2024" (or a typo
    // like "sdptember") is a mistake the form should catch, not store.
    if (!next.intake) {
      const intakeRaw = val("intake").trim();
      const intakeMatch = intakeRaw.match(
        /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})$/i
      );
      if (!intakeMatch) {
        next.intake = 'Enter the intake as a month and year, e.g. "September 2027".';
      } else {
        const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
        const intakeYear = Number(intakeMatch[2]);
        const intakeMonth = MONTHS.indexOf(intakeMatch[1].toLowerCase());
        const today = new Date();
        const notYetPast =
          intakeYear > today.getFullYear() ||
          (intakeYear === today.getFullYear() && intakeMonth >= today.getMonth());
        if (!notYetPast) {
          next.intake = "The intake must be in the future - this one has already started.";
        } else if (intakeYear > today.getFullYear() + 5) {
          next.intake = "Choose an intake within the next five years.";
        }
      }
    }

    if (!next.courseName && !hasLetter(val("courseName"))) {
      next.courseName = "Enter the course name.";
    }
    if (!next.institutionName && !hasLetter(val("institutionName"))) {
      next.institutionName = "Enter the institution name.";
    }
    if (!next.previousQualification && !hasLetter(val("previousQualification"))) {
      next.previousQualification = "Enter your previous qualification.";
    }
    if (!next.address && val("address").length < 5) {
      next.address = "Enter your full address.";
    }
    if (!next.personalStatement && val("personalStatement").length < 30) {
      next.personalStatement = "Write at least a short personal statement (30 characters or more).";
    }
    // Nothing above bounds how LONG a value may be, so a name of 100,000
    // characters passed every check. These caps are deliberately generous -
    // they exist to catch mistakes and abuse, not to argue with unusual but
    // real names, addresses or qualifications.
    //
    // The same limits are enforced in firestore.rules. This file runs in the
    // browser and can be bypassed, so on its own it is guidance rather than
    // protection.
    const MAX_LENGTHS = {
      fullName: 100,
      nationality: 60,
      passportNumber: 20,
      phone: 20,
      address: 250,
      previousQualification: 120,
      institutionName: 120,
      graduationYear: 4,
      gpa: 20,
      courseName: 120,
      intake: 40,
      personalStatement: 4000,
    };
    for (const field of Object.keys(MAX_LENGTHS)) {
      if (next[field]) continue; // a more specific message already won
      const value = val(field);
      if (typeof value === "string" && value.length > MAX_LENGTHS[field]) {
        next[field] = `Keep this to ${MAX_LENGTHS[field]} characters or fewer.`;
      }
    }

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
  const REQUIRED_DOCS = DOC_TYPES.filter(([, , required]) => required).map(([key]) => key);
  const missingDocs = REQUIRED_DOCS.filter((key) => !documents[key]?.path);

  async function uploadOne(docType) {
    setMessage(null);
    const file = files[docType];
    const problem = validateFile(file);
    if (problem) { setMessage({ type: "error", text: uploadError(problem) }); return; }
    setUploadingType(docType);
    try {
      const id = await ensureDraft();
      const path = await uploadTypedDocument(id, docType, file);
      setDocuments((current) => ({ ...current, [docType]: { path, name: file.name } }));
      setMessage({ type: "success", text: "Document uploaded and linked to your draft." });
    }
    catch (error) { if (error.message !== "FORM_INVALID") setMessage({ type: "error", text: uploadError(error) }); }
    finally { setUploadingType(null); }
  }
  async function submit() {
    setMessage(null);
    if (missingDocs.length > 0) {
      const labels = DOC_TYPES.filter(([key]) => missingDocs.includes(key)).map(([, label]) => label).join(", ");
      setMessage({ type: "error", text: "Upload the required documents before submitting: " + labels + "." });
      return;
    }
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
    catch (error) { setMessage({ type: "error", text: error.message === "DOCUMENTS_REQUIRED" || error.message === "DOCUMENT_REQUIRED" ? "Upload the required documents before submitting." : "The application could not be submitted." }); }
    finally { setBusy(false); }
  }

  if (phase === "loading") return <AuthCard title="New application"><p role="status">Loading application form...</p></AuthCard>;
  if (phase === "signed-out") return <AuthCard title="New application"><AlertBanner variant="error">Sign in before starting an application.</AlertBanner><a href="/login">Go to login</a></AuthCard>;
  if (phase === "unverified") return <AuthCard title="New application"><AlertBanner variant="info">Verify your email before applying.</AlertBanner><a href="/verify-email">Verification help</a></AuthCard>;
  if (phase === "error") return <AuthCard title="New application"><AlertBanner variant="error">University information could not be loaded.</AlertBanner></AuthCard>;

  return <PortalShell user={user} current="apply"><div className="min-h-screen pt-8 px-4 pb-16 bg-transparent text-ink"><form className="max-w-[52rem] mx-auto [&>header]:mb-6 [&>header_h1]:mt-[0.2rem] [&>header_h1]:mb-2 [&>header_h1]:text-[clamp(2rem,5vw,3rem)] [&>header_h1]:text-navy-900" onSubmit={(event) => event.preventDefault()} noValidate>
    <header><p className="m-0 text-blue-600 font-extrabold uppercase tracking-[0.08em]">Student application</p><h1>Apply to a university</h1><p>Complete the required details, save a draft, attach evidence and submit.</p></header>
    {message && <AlertBanner variant={message.type}>{message.text}</AlertBanner>}
    <section className={SECTION}><h2>1. University and intake</h2><div className="flex flex-col gap-1"><label className="text-sm font-medium text-ink" htmlFor="universityId">University</label><select className={SELECT} id="universityId" required aria-required="true" value={form.universityId} onChange={(e) => update("universityId", e.target.value)} aria-invalid={!!errors.universityId}><option value="">Select a university</option>{universities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errors.universityId && <p className="text-xs font-medium text-error">{errors.universityId}</p>}</div><div className="grid grid-cols-2 gap-4 my-4 max-sm:grid-cols-1"><div className="flex flex-col gap-1"><label className="text-sm font-medium text-ink" htmlFor="studyLevel">Intended study level</label><select className={SELECT} id="studyLevel" required aria-required="true" value={form.studyLevel} onChange={(e) => update("studyLevel", e.target.value)} aria-invalid={!!errors.studyLevel}><option value="">Select a study level</option><option value="Foundation">Foundation</option><option value="Bachelors">Bachelors</option><option value="Masters">Masters</option><option value="PhD">PhD</option></select>{errors.studyLevel && <p className="text-xs font-medium text-error">{errors.studyLevel}</p>}</div><div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink" htmlFor="apply-intake">Intake</label>
            <select
              className={SELECT}
              id="apply-intake"
              required
              aria-required="true"
              value={form.intake}
              aria-invalid={!!errors.intake}
              onChange={(e) => update("intake", e.target.value)}
            >
              <option value="">Select an intake</option>
              {form.intake && !INTAKE_OPTIONS.includes(form.intake) && (
                <option value={form.intake}>{form.intake}</option>
              )}
              {INTAKE_OPTIONS.map((intake) => (
                <option key={intake} value={intake}>{intake}</option>
              ))}
            </select>
            {errors.intake && <p className="text-xs font-medium text-error">{errors.intake}</p>}
          </div></div><FormField label="Course name" name="courseName" placeholder="e.g. BSc Computer Science" value={form.courseName} onChange={(e) => update("courseName", e.target.value)} error={errors.courseName} required aria-required="true" /></section>
    <section className={SECTION}><h2>2. Personal details</h2><div className="grid grid-cols-2 gap-4 my-4 max-sm:grid-cols-1"><FormField label="Full name" name="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} error={errors.fullName} required aria-required="true" /><FormField label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} error={errors.dateOfBirth} required aria-required="true" /><FormField label="Nationality" name="nationality" value={form.nationality} onChange={(e) => update("nationality", e.target.value)} error={errors.nationality} required aria-required="true" /><FormField label="Phone" name="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} error={errors.phone} required aria-required="true" /><FormField label="Passport number" name="passportNumber" value={form.passportNumber} onChange={(e) => update("passportNumber", e.target.value)} error={errors.passportNumber} required aria-required="true" /></div><FormField label="Address" name="address" value={form.address} onChange={(e) => update("address", e.target.value)} error={errors.address} required aria-required="true" /></section>
    <section className={SECTION}><h2>3. Academic information</h2><FormField label="Previous qualification" name="previousQualification" value={form.previousQualification} onChange={(e) => update("previousQualification", e.target.value)} error={errors.previousQualification} required aria-required="true" /><div className="grid grid-cols-3 gap-4 my-4 max-sm:grid-cols-1"><FormField label="Institution name" name="institutionName" value={form.institutionName} onChange={(e) => update("institutionName", e.target.value)} error={errors.institutionName} required aria-required="true" /><FormField label="Graduation year" name="graduationYear" placeholder="e.g. 2024" value={form.graduationYear} onChange={(e) => update("graduationYear", e.target.value)} error={errors.graduationYear} required aria-required="true" /><FormField label="GPA / Grade" name="gpa" placeholder="e.g. 2:1 or 3.6" value={form.gpa} onChange={(e) => update("gpa", e.target.value)} error={errors.gpa} required aria-required="true" /></div><div className="flex flex-col gap-1 mt-4"><label className="text-sm font-medium text-ink" htmlFor="personalStatement">Personal statement</label><textarea className={TEXTAREA} id="personalStatement" rows="7" value={form.personalStatement} onChange={(e) => update("personalStatement", e.target.value)} aria-invalid={!!errors.personalStatement} required aria-required="true" />{errors.personalStatement && <p className="text-xs font-medium text-error">{errors.personalStatement}</p>}</div></section>
    <section className={SECTION}><h2>4. Supporting documents</h2><p>Upload each document as PDF, JPG or PNG, no larger than 10 MB. Passport copy, academic transcripts and certificates are required; the English language test is optional.</p>
      {DOC_TYPES.map(([docType, label, required]) => (
        <div key={docType} className="my-3 px-4 py-3 border border-border rounded-lg bg-[#fbfcfd]">
          <p className="mt-0 mb-1 text-sm font-semibold text-ink">{label}{required ? "" : " (optional)"}{documents[docType]?.path && <span className="ml-2 text-success font-bold" role="status">Attached</span>}</p>
          {documents[docType]?.name && <p className="mt-0 mb-2 text-xs text-muted">{documents[docType].name}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <input className="block flex-1 min-w-[220px]" type="file" aria-label={label} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/pjpeg,image/png" onChange={(e) => { setFiles((current) => ({ ...current, [docType]: e.target.files?.[0] || null })); setMessage(null); }} />
            <LoadingButton type="button" full={false} loading={uploadingType === docType} onClick={() => uploadOne(docType)}>{documents[docType]?.path ? "Replace" : "Upload"}</LoadingButton>
          </div>
        </div>
      ))}
    </section>
    <div className="flex items-center gap-3 flex-wrap mt-6 [&>a]:ml-auto max-sm:flex-col max-sm:items-stretch max-sm:[&>*]:w-full max-sm:[&>*]:text-center max-sm:[&>a]:ml-0"><LoadingButton type="button" variant="secondary" full={false} loading={busy} onClick={saveDraft}>Save draft</LoadingButton><LoadingButton type="button" variant="primary" full={false} loading={busy} onClick={submit} disabled={missingDocs.length > 0}>Submit application</LoadingButton><a className="text-link" href="/student">Cancel</a></div>
  </form></div></PortalShell>;
}
