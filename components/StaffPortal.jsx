"use client";

import { useState, useEffect } from "react";
import { getApplicationsForUniversity, recordDecision } from "../lib/db";
import { getDocumentUrl } from "../lib/storage";
import {
  LayoutDashboard,
  FileText,
  Upload,
  BadgeCheck,
  Settings,
  HelpCircle,
  Menu,
  X,
  Users,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function StaffPortal({
  subRoute = "staff-overview",
  setScreen,
  user,
  profile,
  onSignOut,
  notify,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const goScreen = (id) => {
    setMobileNavOpen(false);
    setScreen(id);
  };
  const [adminApps, setAdminApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  // Decision Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionOutcome, setDecisionOutcome] = useState("offer");
  const [decisionMessage, setDecisionMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Internal Notes State
  const [internalNotes, setInternalNotes] = useState([
    { author: "Daniel Kim", date: "16 Jul, 10:24", text: "Academic evidence and transcript verified. Preliminary review complete." },
  ]);
  const [noteInput, setNoteInput] = useState("");

  const universityId = profile?.universityId || "ashworth-uni-001";
  const uniNames = {
    "solent": "Southampton Solent University",
    "ashworth-uni-001": "Ashworth University",
    "harborview-uni-002": "Harborview University",
    "st-eddas-college-003": "St Edda's College",
  };
  const universityName = uniNames[universityId] || (universityId === "solent" ? "Southampton Solent University" : universityId);
  const uniInitials = universityName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const totalAppsCount = adminApps.length;
  const submittedCount = adminApps.filter((a) => a.status === "submitted").length;
  const decisionsCount = adminApps.filter((a) => a.status === "offer" || a.status === "rejected").length;
  const offerCount = adminApps.filter((a) => a.status === "offer").length;
  const offerRate = decisionsCount > 0 ? Math.round((offerCount / decisionsCount) * 100) : 100;
  const docReviewCount = adminApps.filter((a) => a.documentPath).length;
  const underReviewCount = adminApps.filter((a) => a.status === "under_review").length;
  const readyCount = adminApps.filter((a) => a.status === "submitted" && a.documentPath).length;

  useEffect(() => {
    loadQueue();
  }, [profile]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const apps = await getApplicationsForUniversity(universityId);
      setAdminApps(apps);
      if (apps.length > 0 && !selectedApp) {
        setSelectedApp(apps[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (path) => {
    if (!path) return;
    try {
      const url = await getDocumentUrl(path);
      window.open(url, "_blank");
    } catch (err) {
      notify("Download Error", err.message || "Failed to retrieve download URL.");
    }
  };

  const handleAddInternalNote = () => {
    if (!noteInput.trim()) return;
    const authorName = profile?.fullName || profile?.name || "Admissions Officer";
    const dateStr = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    setInternalNotes((prev) => [...prev, { author: authorName, date: dateStr, text: noteInput }]);
    setNoteInput("");
    notify("Internal Note Added", "Note saved to application review log.");
  };

  const handleRecordDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) {
      notify("Select Application", "Choose an application first to record a decision.");
      return;
    }
    setIsRecording(true);
    try {
      const finalOutcome = decisionOutcome === "offer" ? "offer" : "rejected";
      await recordDecision(
        selectedApp.id,
        user ? user.uid : "admin-staff-001",
        finalOutcome,
        decisionMessage || `Decision recorded: ${finalOutcome}`
      );

      // Attempt background decision email dispatch
      try {
        await fetch("/api/email/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: selectedApp.id,
            studentEmail: selectedApp.form?.email || user?.email || "student@example.com",
            studentName: selectedApp.form?.fullName || "Applicant",
            decision: finalOutcome,
            message: decisionMessage,
            universityName: universityName,
          }),
        });
      } catch (e) {
        console.warn("Decision email trigger:", e);
      }

      notify("Decision Recorded", `Application ${selectedApp.id} updated to ${finalOutcome}`);
      setShowDecisionModal(false);
      setDecisionMessage("");
      await loadQueue();
    } catch (err) {
      notify("Decision Error", err.message);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <section className="screen app-screen is-active" data-screen={subRoute}>
      <div className="portal-shell staff-shell">
        {/* Sidebar */}
        <aside className={mobileNavOpen ? "compact-sidebar staff-sidebar is-mobile-open" : "compact-sidebar staff-sidebar"}>
          <button className="sidebar-brand" type="button" onClick={() => goScreen("staff-overview")}>
            <span className="brand-mark">{uniInitials}</span>
            <div>
              <strong>{universityName.split(" ")[0]}</strong>
              <small>University workspace</small>
            </div>
          </button>
          <button
            className="mobile-nav-toggle"
            type="button"
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X /> : <Menu />}
          </button>
          <nav className="sidebar-nav" aria-label="Staff navigation">
            <button className={subRoute === "staff-overview" ? "is-current" : ""} type="button" onClick={() => goScreen("staff-overview")}>
              <span><LayoutDashboard className="w-4 h-4" /></span>Overview
            </button>
            <button className={subRoute === "admissions" ? "is-current" : ""} type="button" onClick={() => goScreen("admissions")}>
              <span><FileText className="w-4 h-4" /></span>Applications queue <b>{totalAppsCount}</b>
            </button>
            <button className={subRoute === "staff-documents" ? "is-current" : ""} type="button" onClick={() => goScreen("staff-documents")}>
              <span><Upload className="w-4 h-4" /></span>Document requests <b>{docReviewCount}</b>
            </button>
            <button className={subRoute === "staff-decisions" ? "is-current" : ""} type="button" onClick={() => goScreen("staff-decisions")}>
              <span><BadgeCheck className="w-4 h-4" /></span>Decisions <b>{decisionsCount}</b>
            </button>
            <button className={subRoute === "admin" ? "is-current" : ""} type="button" onClick={() => goScreen("admin")}>
              <span><Settings className="w-4 h-4" /></span>Administration
            </button>
          </nav>

          <div className="sidebar-footer" style={{ marginTop: "auto" }}>
            <div className="user-chip">
              <span>{uniInitials}</span>
              <div>
                <strong>{profile?.fullName || profile?.name || user?.email?.split("@")[0] || "Admissions Officer"}</strong>
                <small>Staff ({universityId})</small>
              </div>
            </div>
          </div>
        </aside>

        {/* Workspace */}
        <div className="portal-page">
          <header className="app-topbar">
            <nav className="breadcrumb">
              <span>{universityName}</span>
              <span>/</span>
              <strong style={{ textTransform: "capitalize" }}>{subRoute.replace("staff-", "")}</strong>
            </nav>
            <div className="topbar-actions">
              <span className="avatar">{uniInitials}</span>
            </div>
          </header>

          <div className="workspace-content staff-content">
            {/* 1. OVERVIEW VIEW */}
            {subRoute === "staff-overview" && (
              <>
                <div className="page-header">
                  <div>
                    <p className="eyebrow">Cycle 2026/2027</p>
                    <h1>Admissions overview</h1>
                    <p>Operational workload and application progress for {universityName}.</p>
                  </div>
                  <button className="button button-primary" type="button" onClick={() => setScreen("admissions")}>
                    Open queue
                  </button>
                </div>

                <div className="stat-grid">
                  <article><span>Open applications</span><strong>{totalAppsCount}</strong><small>↑ Active cycle</small></article>
                  <article><span>Submitted drafts</span><strong>{submittedCount}</strong><small>Awaiting review</small></article>
                  <article><span>Decisions issued</span><strong>{decisionsCount}</strong><small>{offerRate}% offer rate</small></article>
                  <article><span>Median review time</span><strong>2.4d</strong><small>↓ 1.2 days</small></article>
                </div>

                <div className="staff-dashboard-grid" style={{ marginTop: "24px" }}>
                  <section className="content-card">
                    <div className="section-title-row">
                      <div><p className="micro-label">Workload</p><h2>Applications by stage</h2></div>
                      <button className="text-button" type="button" onClick={() => setScreen("admissions")}>View queue</button>
                    </div>
                    <div className="bar-chart" aria-label="Application stage chart">
                      <div style={{ "--value": `${Math.min(100, Math.max(15, (submittedCount / (totalAppsCount || 1)) * 100))}%` }}>
                        <span>Submitted</span><i></i><strong>{submittedCount}</strong>
                      </div>
                      <div style={{ "--value": `${Math.min(100, Math.max(15, (docReviewCount / (totalAppsCount || 1)) * 100))}%` }}>
                        <span>Document review</span><i></i><strong>{docReviewCount}</strong>
                      </div>
                      <div style={{ "--value": `${Math.min(100, Math.max(15, (underReviewCount / (totalAppsCount || 1)) * 100))}%` }}>
                        <span>Finance check</span><i></i><strong>{underReviewCount}</strong>
                      </div>
                      <div style={{ "--value": `${Math.min(100, Math.max(15, (readyCount / (totalAppsCount || 1)) * 100))}%` }}>
                        <span>Ready for decision</span><i></i><strong>{readyCount}</strong>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            )}

            {/* 2. ADMISSIONS QUEUE VIEW */}
            {subRoute === "admissions" && (
              <>
                <div className="page-header">
                  <div>
                    <p className="eyebrow">Admissions workspace</p>
                    <h1>Application queue</h1>
                    <p>Review and progress applications assigned to Ashworth University.</p>
                  </div>
                  <button className="button button-secondary" type="button" onClick={loadQueue}>
                    Refresh queue
                  </button>
                </div>

                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Application ID</th>
                        <th>Student UID</th>
                        <th>Status</th>
                        <th>Document</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminApps.map((app) => (
                        <tr key={app.id}>
                          <td><strong>{app.id}</strong></td>
                          <td>{app.studentUid}</td>
                          <td>
                            <span className={`status ${app.status === "offer" ? "status-success" : app.status === "submitted" ? "status-info" : "status-neutral"}`}>
                              {app.status}
                            </span>
                          </td>
                          <td>{app.documentPath ? "Document Uploaded" : "None"}</td>
                          <td>
                            <button
                              className="button button-quiet button-small"
                              type="button"
                              onClick={() => {
                                setSelectedApp(app);
                                setScreen("detail");
                              }}
                            >
                              Review & Record Decision →
                            </button>
                          </td>
                        </tr>
                      ))}
                      {adminApps.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>
                            No applications submitted to this university yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 3. CASE REVIEW & DETAIL VIEW */}
            {subRoute === "detail" && (
              <div className="record-page-shell">
                <header className="record-topbar">
                  <button className="back-link" type="button" onClick={() => setScreen("admissions")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    ← Back to application queue
                  </button>
                  <div className="record-top-actions">
                    <button className="button button-dark" type="button" onClick={() => setShowDecisionModal(true)}>
                      Record decision
                    </button>
                  </div>
                </header>

                {selectedApp ? (
                  <div className="record-page-header">
                    <div className="person-heading">
                      <span className="large-avatar">AO</span>
                      <div>
                        <p className="eyebrow">Application {selectedApp.id}</p>
                        <h1>Student ID: {selectedApp.studentUid}</h1>
                        <p>Ashworth University · Status: {selectedApp.status}</p>
                      </div>
                    </div>
                    <span className="status status-info">{selectedApp.status}</span>
                  </div>
                ) : (
                  <div className="content-card"><p>Select an application from the queue first.</p></div>
                )}

                {selectedApp && (
                  <div className="case-layout">
                    <div className="case-main">
                      <section className="case-section">
                        <h2>Application Profile & Evidence (PRD 4.3.2)</h2>
                        <p><strong>Student ID:</strong> {selectedApp.studentUid}</p>
                        <p><strong>Course:</strong> {selectedApp.courseName || "BSc (Hons) Computer Science"}</p>
                        <p><strong>Uploaded Document:</strong> {selectedApp.documentPath || "No evidence document uploaded yet"}</p>
                        {selectedApp.documentPath && (
                          <button
                            className="button button-secondary button-small"
                            type="button"
                            onClick={() => handleDownloadDocument(selectedApp.documentPath)}
                            style={{ marginTop: "8px" }}
                          >
                            Download / View uploaded document (PRD 4.3.2)
                          </button>
                        )}
                        {selectedApp.latestDecisionMessage && (
                          <div style={{ marginTop: "12px", padding: "12px", background: "var(--info-bg)", borderRadius: "6px" }}>
                            <strong>Decision Recorded:</strong> {selectedApp.latestDecisionMessage}
                          </div>
                        )}
                      </section>

                      <section className="case-section internal-notes" style={{ marginTop: "24px" }}>
                        <div className="section-title-row">
                          <div>
                            <p className="micro-label">Staff Only (PRD 4.3.2)</p>
                            <h2>Internal notes</h2>
                          </div>
                          <span className="privacy-label">Not visible to applicant</span>
                        </div>
                        <ol style={{ paddingLeft: "16px", marginBottom: "16px" }}>
                          {internalNotes.map((note, idx) => (
                            <li key={idx} style={{ marginBottom: "10px" }}>
                              <div><strong>{note.author}</strong> <small style={{ marginLeft: "6px", color: "var(--muted)" }}>{note.date}</small></div>
                              <p style={{ margin: "4px 0 0 0" }}>{note.text}</p>
                            </li>
                          ))}
                        </ol>
                        <label htmlFor="internal-note">Add an internal note</label>
                        <textarea
                          id="internal-note"
                          rows="3"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Record review notes or internal comments..."
                        />
                        <div className="note-actions" style={{ marginTop: "8px" }}>
                          <button
                            className="button button-secondary"
                            type="button"
                            onClick={handleAddInternalNote}
                          >
                            Add internal note
                          </button>
                        </div>
                      </section>

                      <button
                        className="button button-dark button-large"
                        type="button"
                        onClick={() => setShowDecisionModal(true)}
                        style={{ marginTop: "24px" }}
                      >
                        Record decision for {selectedApp.id}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. STAFF DOCUMENTS VIEW */}
            {subRoute === "staff-documents" && (
              <div className="content-card">
                <h2>Document Requests</h2>
                <p>Track requested evidence across submitted applications.</p>
              </div>
            )}

            {/* 5. STAFF DECISIONS LOG VIEW */}
            {subRoute === "staff-decisions" && (
              <div className="content-card">
                <h2>Decision History Log</h2>
                <p>Complete record of offers and rejections issued for {universityId}.</p>
                <div className="request-list" style={{ marginTop: "16px" }}>
                  {adminApps.filter(a => a.status === "offer" || a.status === "rejected").map(a => (
                    <article key={a.id} className="decision-row">
                      <div>
                        <strong>Application {a.id}</strong>
                        <small>Student: {a.studentUid}</small>
                      </div>
                      <span className={`status ${a.status === "offer" ? "status-success" : "status-neutral"}`}>{a.status}</span>
                      <time>{a.latestDecisionMessage || "Recorded"}</time>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* 6. ADMIN SETTINGS VIEW */}
            {subRoute === "admin" && (
              <div className="content-card">
                <h2>University Settings & Course Catalogue</h2>
                <p>Configured for institution: <strong>{universityId}</strong></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDecisionModal(false)} aria-hidden="true" />
          <dialog className="modal" open role="dialog">
          <form onSubmit={handleRecordDecisionSubmit}>
            <header>
              <div>
                <p className="micro-label">Admissions outcome</p>
                <h2>Record decision for {selectedApp?.id}</h2>
              </div>
              <button type="button" onClick={() => setShowDecisionModal(false)}>×</button>
            </header>
            <div className="modal-body">
              <label>Outcome
                <select value={decisionOutcome} onChange={(e) => setDecisionOutcome(e.target.value)} required>
                  <option value="offer">Offer (Conditional / Unconditional)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label>Message to applicant
                <textarea
                  rows="4"
                  value={decisionMessage}
                  onChange={(e) => setDecisionMessage(e.target.value)}
                  placeholder="Explain the outcome and next steps in clear, respectful language..."
                  required
                />
              </label>
            </div>
            <footer>
              <button className="button button-quiet" type="button" onClick={() => setShowDecisionModal(false)}>
                Cancel
              </button>
              <button className="button button-dark" type="submit" disabled={isRecording}>
                {isRecording ? "Recording..." : "Confirm & Record Decision"}
              </button>
            </footer>
          </form>
        </dialog>
      </>
      )}
    </section>
  );
}
