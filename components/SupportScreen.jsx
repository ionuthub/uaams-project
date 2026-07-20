"use client";

import { useState } from "react";
import PublicHeader from "./PublicHeader";
import { Search } from "lucide-react";

export default function SupportScreen({ setScreen, user, onSignOut, onOpenModal }) {
  const [openAccordions, setOpenAccordions] = useState({});

  const toggleAccordion = (id) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="screen support-screen is-active" data-screen="support">
      <PublicHeader setScreen={setScreen} currentScreen="support" user={user} onSignOut={onSignOut} />

      <div className="support-hero">
        <p className="eyebrow">Help centre</p>
        <h1 id="support-title">How can we help?</h1>
        <label className="help-search">
          <Search className="w-4 h-4" />
          <input placeholder="Search questions and guidance" />
        </label>
      </div>

      <div className="help-grid">
        <article className="help-card">
          <span>▤</span>
          <h2>Applications</h2>
          <p>Starting, saving, submitting and tracking an application.</p>
          <button className="text-button" type="button" onClick={() => toggleAccordion("app")}>
            {openAccordions["app"] ? "Hide guidance" : "View guidance"}
          </button>
          {openAccordions["app"] && (
            <div className="accordion-content">
              Drafts save automatically. After submitting, use the application timeline to see each review stage.
            </div>
          )}
        </article>

        <article className="help-card">
          <span>⇧</span>
          <h2>Documents</h2>
          <p>File requirements, uploads and verification statuses.</p>
          <button className="text-button" type="button" onClick={() => toggleAccordion("doc")}>
            {openAccordions["doc"] ? "Hide guidance" : "View guidance"}
          </button>
          {openAccordions["doc"] && (
            <div className="accordion-content">
              Upload PDF, JPG or PNG files up to 10 MB. Requested evidence includes a clear deadline.
            </div>
          )}
        </article>

        <article className="help-card">
          <span>£</span>
          <h2>Payments</h2>
          <p>Application fees, failed payments and receipts.</p>
          <button className="text-button" type="button" onClick={() => toggleAccordion("pay")}>
            {openAccordions["pay"] ? "Hide guidance" : "View guidance"}
          </button>
          {openAccordions["pay"] && (
            <div className="accordion-content">
              UAAMS uses a hosted payment provider. Card details are never stored by UAAMS.
            </div>
          )}
        </article>

        <article className="help-card">
          <span>✓</span>
          <h2>Decisions</h2>
          <p>Understanding conditional and unconditional offers.</p>
          <button className="text-button" type="button" onClick={() => toggleAccordion("dec")}>
            {openAccordions["dec"] ? "Hide guidance" : "View guidance"}
          </button>
          {openAccordions["dec"] && (
            <div className="accordion-content">
              Decisions appear in your portal and are also sent to your verified email address.
            </div>
          )}
        </article>
      </div>

      <section className="contact-panel">
        <div>
          <p className="eyebrow">Still need support?</p>
          <h2>Talk to the UAAMS team</h2>
          <p>Monday–Friday, 09:00–17:00 UK time</p>
        </div>
        <button className="button button-dark" type="button" onClick={() => onOpenModal("contact")}>
          Contact support
        </button>
      </section>
    </section>
  );
}
