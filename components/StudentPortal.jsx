"use client";

import { useState, useEffect } from "react";
import {
  getStudentApplications,
  createApplication,
  submitApplication,
  getUniversities,
} from "../lib/db";
import { uploadDocument, validateFile, getDocumentUrl } from "../lib/storage";
import {
  LayoutDashboard,
  FileText,
  Upload,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  CheckCircle,
  Plus,
  ArrowRight,
  FileIcon,
} from "lucide-react";

export default function StudentPortal({
  subRoute = "dashboard",
  setScreen,
  user,
  profile,
  onSignOut,
  notify,
  onOpenModal,
}) {
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [universities, setUniversities] = useState([]);

  // Form State
  const [formStep, setFormStep] = useState(1);
  const [selectedUniId, setSelectedUniId] = useState("");
  const [fullName, setFullName] = useState(profile?.name || "Amara Osei");
  const [phone, setPhone] = useState("+44 7700 900123");
  const [addressLine1, setAddressLine1] = useState("14 Roundhay Terrace");
  const [city, setCity] = useState("Leeds");
  const [postcode, setPostcode] = useState("LS8 2DP");
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoadingApps(true);
    try {
      const [apps, unis] = await Promise.all([
        getStudentApplications(user.uid),
        getUniversities(),
      ]);
      setApplications(apps);
      setUniversities(unis);
      if (unis.length > 0 && !selectedUniId) {
        setSelectedUniId(unis[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleCreateDraft = async () => {
    setScreen("form");
    const studentUid = user ? user.uid : "demo-student-uid-001";
    try {
      const targetUni = selectedUniId || (universities[0] ? universities[0].id : "ashworth-uni-001");
      const appId = await createApplication(studentUid, targetUni, {
        fullName,
        phone,
        addressLine1,
        city,
        postcode,
        courseName: "BSc (Hons) Computer Science",
      });
      notify("Draft Started", `Created application form (${appId})`);
      loadData().catch((e) => console.warn(e));
    } catch (err) {
      console.warn("createApplication fallback:", err.message);
    }
  };

  const handleSubmitDraft = async (appId) => {
    try {
      await submitApplication(appId);
      notify("Application Submitted!", "Your application is now under university review.");
      await loadData();
      setScreen("confirmation");
    } catch (err) {
      notify("Submission Error", err.message);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      notify("File Required", "Please choose a file to upload.");
      return;
    }
    const problem = validateFile(uploadFile);
    if (problem) {
      notify("Validation Failed", problem);
      return;
    }

    const draft = applications.find((a) => a.status === "draft") || applications[0];
    if (!draft) {
      notify("No Active Application", "Create a draft application first to attach documents.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(draft.id, uploadFile);
      notify("Upload Complete", `Successfully uploaded ${uploadFile.name}`);
      setUploadFile(null);
      await loadData();
    } catch (err) {
      notify("Upload Error", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = async (path) => {
    if (!path) return;
    try {
      const url = await getDocumentUrl(path);
      window.open(url, "_blank");
    } catch (err) {
      notify("View Error", err.message || "Failed to retrieve view link.");
    }
  };

  const activeApp = applications.find((a) => a.status !== "rejected") || applications[0];

  return (
    <section className="screen app-screen is-active" data-screen={subRoute}>
      <div className="portal-shell">
        {/* Sidebar */}
        <aside className="compact-sidebar">
          <button className="sidebar-brand" type="button" onClick={() => setScreen("dashboard")}>
            <span className="brand-mark">U</span>
            <div>
              <strong>UAAMS</strong>
              <small>Applicant portal</small>
            </div>
          </button>
          <nav className="sidebar-nav" aria-label="Applicant navigation">
            <button className={subRoute === "dashboard" ? "is-current" : ""} type="button" onClick={() => setScreen("dashboard")}>
              <span><LayoutDashboard className="w-4 h-4" /></span>Dashboard
            </button>
            <button className={subRoute === "applications" ? "is-current" : ""} type="button" onClick={() => setScreen("applications")}>
              <span><FileText className="w-4 h-4" /></span>My applications
            </button>
            <button className={subRoute === "documents" ? "is-current" : ""} type="button" onClick={() => setScreen("documents")}>
              <span><Upload className="w-4 h-4" /></span>Documents <b>{applications.filter(a => a.documentPath).length}</b>
            </button>
            <button className={subRoute === "payments" ? "is-current" : ""} type="button" onClick={() => setScreen("payments")}>
              <span><CreditCard className="w-4 h-4" /></span>Payments
            </button>
            <button className={subRoute === "notifications" ? "is-current" : ""} type="button" onClick={() => setScreen("notifications")}>
              <span><Bell className="w-4 h-4" /></span>Notifications <b>2</b>
            </button>
          </nav>
          <div className="sidebar-footer" style={{ marginTop: "auto", paddingTop: "16px" }}>
            <button type="button" onClick={() => setScreen("support")}>
              <span><HelpCircle className="w-4 h-4" /></span>Help & support
            </button>
            <button type="button" onClick={() => setScreen("account")}>
              <span><Settings className="w-4 h-4" /></span>Account settings
            </button>
            <div className="user-chip" style={{ marginTop: "12px" }}>
              <img className="user-avatar-photo" src="/assets/avatar-amara-osei.png" alt="" />
              <div>
                <strong>{profile?.name || user?.email?.split("@")[0] || "Applicant"}</strong>
                <small>Applicant</small>
              </div>
            </div>
          </div>
        </aside>

        {/* Workspace */}
        <main id="main-content" className="portal-page" tabIndex="-1">
          <header className="app-topbar">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <span>Applicant portal</span>
              <span>/</span>
              <strong style={{ textTransform: "capitalize" }}>{subRoute}</strong>
            </nav>
            <div className="topbar-actions">
              <button type="button" onClick={() => setScreen("notifications")} aria-label="Notifications, 2 unread">
                <Bell className="w-4 h-4" />
                <b>2</b>
              </button>
              <img className="avatar avatar-photo" src="/assets/avatar-amara-osei.png" alt="Amara Osei" />
            </div>
          </header>

          <div className="workspace-content" role="region" aria-live="polite">
            {/* 1. DASHBOARD VIEW */}
            {subRoute === "dashboard" && (
              <>
                <div className="page-header">
                  <div>
                    <p className="eyebrow">Welcome back</p>
                    <h1>Applicant Dashboard</h1>
                    <p>Track your applications, upload documents, and view decisions.</p>
                  </div>
                  <button className="button button-primary" type="button" onClick={handleCreateDraft}>
                    <Plus className="w-4 h-4" style={{ marginRight: "6px" }} /> Start new application
                  </button>
                </div>

                {activeApp ? (
                  <div className="application-cards">
                    <article className="application-card-feature">
                      <div>
                        <span className={`status ${activeApp.status === "offer" ? "status-success" : activeApp.status === "draft" ? "status-neutral" : "status-warning"}`}>
                          {activeApp.status === "offer" ? "Conditional offer" : activeApp.status === "draft" ? "Draft in progress" : activeApp.status}
                        </span>
                        <p className="micro-label">{activeApp.universityId || "Ashworth University"}</p>
                        <h2>{activeApp.courseName || "BSc (Hons) Computer Science"}</h2>
                        <p>Reference {activeApp.id} · Status: {activeApp.status}</p>
                      </div>

                      <ol className="compact-progress" style={{ margin: "20px 0" }}>
                        <li className="done">Submitted</li>
                        <li className={activeApp.documentPath ? "done" : "current"}>Documents</li>
                        <li className={activeApp.status === "under_review" || activeApp.status === "offer" ? "done" : ""}>Review</li>
                        <li className={activeApp.status === "offer" ? "done" : ""}>Decision</li>
                      </ol>

                      {activeApp.latestDecisionMessage && (
                        <div style={{ padding: "12px", background: "var(--info-bg)", borderLeft: "4px solid var(--info)", borderRadius: "4px", marginBottom: "16px" }}>
                          <strong>Message from Admissions:</strong> {activeApp.latestDecisionMessage}
                        </div>
                      )}

                      <div className="application-card-action">
                        <strong>
                          {activeApp.status === "draft"
                            ? "Complete your application details"
                            : activeApp.status === "offer"
                            ? "Accept or decline your offer"
                            : "Upload evidence or check notifications"}
                        </strong>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => {
                            if (activeApp.status === "draft") setScreen("form");
                            else if (activeApp.status === "offer") setScreen("decision-outcome");
                            else setScreen("documents");
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    </article>
                  </div>
                ) : (
                  <div className="content-card" style={{ textAlign: "center", padding: "48px 24px" }}>
                    <h2>No applications yet</h2>
                    <p>Start an application to explore university programs and submit your evidence.</p>
                    <button className="button button-primary" type="button" onClick={handleCreateDraft}>
                      Start application
                    </button>
                  </div>
                )}
              </>
            )}

            {/* 2. APPLICATIONS VIEW */}
            {subRoute === "applications" && (
              <>
                <div className="page-header">
                  <div>
                    <p className="eyebrow">Your applications</p>
                    <h1>My applications</h1>
                    <p>Manage drafts and follow submitted applications.</p>
                  </div>
                  <button className="button button-primary" type="button" onClick={handleCreateDraft}>
                    Start new application
                  </button>
                </div>

                <div className="application-cards">
                  {applications.length > 0 ? (
                    applications.map((app) => (
                      <article key={app.id} className="application-card-feature">
                        <div>
                          <span className={`status ${app.status === "offer" ? "status-success" : app.status === "draft" ? "status-neutral" : "status-warning"}`}>
                            {app.status}
                          </span>
                          <p className="micro-label">{app.universityId}</p>
                          <h2>{app.courseName || "BSc (Hons) Computer Science"}</h2>
                          <p>Reference {app.id} · Document: {app.documentPath ? "Attached" : "None"}</p>
                        </div>
                        <div className="application-card-action">
                          {app.status === "draft" ? (
                            <button className="button button-secondary" type="button" onClick={() => handleSubmitDraft(app.id)}>
                              Submit application draft
                            </button>
                          ) : (
                            <button className="button button-secondary" type="button" onClick={() => setScreen("documents")}>
                              View documents
                            </button>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="content-card">
                      <p>You have no current applications. Click "Start new application" above.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 3. FORM / APPLICATION DETAILS VIEW */}
            {subRoute === "form" && (
              <div className="content-card">
                <h2>Application Form (PRD Section 4.2.3)</h2>
                <p>Complete your personal, academic, and course details for submission.</p>
                <form onSubmit={(e) => { e.preventDefault(); handleCreateDraft(); }} className="application-form" style={{ marginTop: "24px" }}>
                  <fieldset>
                    <legend>Personal Information (PRD 4.2.3)</legend>
                    <label>Full legal name
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </label>
                    <div className="field-grid">
                      <label>Date of birth
                        <input type="date" defaultValue="2005-04-18" required />
                      </label>
                      <label>Nationality
                        <input defaultValue="Nigerian" required />
                      </label>
                    </div>
                    <label>Passport number
                      <input defaultValue="A12345678" required />
                    </label>
                  </fieldset>

                  <fieldset style={{ marginTop: "20px" }}>
                    <legend>Academic Information (PRD 4.2.3)</legend>
                    <div className="field-grid">
                      <label>Highest qualification
                        <input defaultValue="High School Diploma / A-Level" required />
                      </label>
                      <label>Institution name
                        <input defaultValue="Federal Government College" required />
                      </label>
                    </div>
                    <div className="field-grid">
                      <label>Graduation year
                        <input type="number" defaultValue="2025" required />
                      </label>
                      <label>GPA / Grade
                        <input defaultValue="A / 3.8 GPA" required />
                      </label>
                    </div>
                  </fieldset>

                  <fieldset style={{ marginTop: "20px" }}>
                    <legend>Contact Information</legend>
                    <label>Mobile phone number
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </label>
                    <label>Address line 1
                      <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
                    </label>
                    <div className="field-grid">
                      <label>City<input value={city} onChange={(e) => setCity(e.target.value)} required /></label>
                      <label>Postcode<input value={postcode} onChange={(e) => setPostcode(e.target.value)} required /></label>
                    </div>
                  </fieldset>

                  <div className="form-actions" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                    <button className="button button-primary" type="submit">
                      Save application draft
                    </button>
                    {activeApp?.status === "draft" && (
                      <button className="button button-dark" type="button" onClick={() => handleSubmitDraft(activeApp.id)}>
                        Submit draft to university
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* 4. DOCUMENTS VIEW */}
            {subRoute === "documents" && (
              <>
                <div className="page-header">
                  <div>
                    <p className="eyebrow">Secure evidence centre</p>
                    <h1>Documents</h1>
                    <p>Respond to requests and upload documents to your application.</p>
                  </div>
                </div>

                <form className="content-card" onSubmit={handleFileUpload} style={{ marginBottom: "24px" }}>
                  <h2>Upload new document</h2>
                  <p>Accepted formats: PDF, JPG, PNG (Max size: 10MB per IS-07 validation).</p>

                  <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                    />
                  </div>

                  <button className="button button-dark" type="submit" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Upload document securely"}
                  </button>
                </form>

                <div className="content-card">
                  <h2>Uploaded document library</h2>
                  <div className="document-table" style={{ marginTop: "16px" }}>
                    {applications.filter(a => a.documentPath).map(app => (
                      <article key={app.id} className="document-row">
                        <span className="file-icon">FILE</span>
                        <div>
                          <strong>{app.documentPath.split("/").pop()}</strong>
                          <p>App Ref: {app.id} · {app.universityId}</p>
                        </div>
                        <span className="status status-success">Uploaded</span>
                        <button
                          className="button button-quiet button-small"
                          type="button"
                          onClick={() => handleViewDocument(app.documentPath)}
                          style={{ marginLeft: "auto" }}
                        >
                          View file →
                        </button>
                      </article>
                    ))}
                    {applications.filter(a => a.documentPath).length === 0 && (
                      <p style={{ color: "var(--muted)" }}>No documents uploaded yet.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 5. PAYMENTS VIEW */}
            {subRoute === "payments" && (
              <div className="payment-layout">
                <section className="payment-summary-card">
                  <p className="micro-label">Payment status</p>
                  <span className="payment-success-mark">✓</span>
                  <h2>£25.00 paid</h2>
                  <p>Ashworth University · BSc Computer Science</p>
                  <dl>
                    <div><dt>Payment reference</dt><dd>PAY-88231</dd></div>
                    <div><dt>Date</dt><dd>3 July 2026</dd></div>
                  </dl>
                  <button className="button button-secondary button-full" type="button" onClick={() => notify("Receipt Downloaded", "PDF/UA-1 accessible receipt downloaded.")}>
                    Download receipt (PDF/UA-1 Accessible)
                  </button>
                </section>
                <section className="content-card">
                  <p className="micro-label">Mock payment checkout</p>
                  <h2>Demonstration checkout</h2>
                  <p>Hosted-payment demonstration (does not store real card information).</p>
                  <div className="checkout-preview">
                    <div><span>Application fee</span><strong>£25.00</strong></div>
                    <button className="button button-dark button-large button-full" type="button" onClick={() => notify("Payment Processed", "Application fee of £25.00 confirmed.")}>
                      Pay securely - £25.00
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* 6. NOTIFICATIONS VIEW */}
            {subRoute === "notifications" && (
              <div className="content-card">
                <h2>Message centre</h2>
                <div className="notification-feed" style={{ marginTop: "16px" }}>
                  <article className="notification-item unread">
                    <span className="notification-icon success-dot">✓</span>
                    <div>
                      <div><strong>Application status updated</strong><time>Today</time></div>
                      <p>Your application status and decision updates appear here in real time.</p>
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* 7. ACCOUNT VIEW */}
            {subRoute === "account" && (
              <div className="content-card narrow-workspace">
                <h2>Account Settings</h2>
                <div style={{ marginTop: "16px" }}>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Role:</strong> {profile?.role || "student"}</p>
                </div>
                <div style={{ marginTop: "24px" }}>
                  <button className="button button-secondary" type="button" onClick={onSignOut}>
                    Sign out
                  </button>
                </div>
              </div>
            )}

            {/* 8. CONFIRMATION VIEW */}
            {subRoute === "confirmation" && (
              <section className="submission-success">
                <span className="success-mark">✓</span>
                <p className="eyebrow">Submitted successfully</p>
                <h1>Your application is under review</h1>
                <p>The university has received your application and will review your evidence.</p>
                <div style={{ marginTop: "24px" }}>
                  <button className="button button-primary" type="button" onClick={() => setScreen("dashboard")}>
                    Return to dashboard
                  </button>
                </div>
              </section>
            )}

            {/* 9. DECISION OUTCOME VIEW */}
            {subRoute === "decision-outcome" && (
              <section className="decision-hero">
                <div>
                  <p className="eyebrow">Application decision</p>
                  <span className="status status-success">Conditional offer</span>
                  <h1>Offer issued by university</h1>
                  <p>{activeApp?.latestDecisionMessage || "Congratulations! You have received a conditional offer."}</p>
                  <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
                    <button className="button button-primary" type="button" onClick={() => notify("Offer Accepted", "You accepted the offer.")}>
                      Accept offer
                    </button>
                    <button className="button button-secondary" type="button" onClick={() => notify("Offer Declined", "You declined the offer.")}>
                      Decline offer
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}
