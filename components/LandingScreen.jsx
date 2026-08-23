"use client";

import { useState } from "react";
import PublicHeader from "./PublicHeader";
import { Search, Check } from "lucide-react";
import { UNIVERSITIES, coursesForUniversity } from "../lib/course-catalog.mjs";

export default function LandingScreen({ setScreen, universities, onSelectCourse, user, onSignOut }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setScreen("courses");
  };

  return (
    <section className="screen is-active" data-screen="landing" aria-labelledby="landing-title">
      <PublicHeader setScreen={setScreen} currentScreen="landing" user={user} onSignOut={onSignOut} />

      <div className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">University applications, made clearer</p>
          <h1 id="landing-title">Your next chapter starts with one confident application.</h1>
          <p className="hero-intro">
            Discover courses, submit evidence and follow every decision from one secure, transparent service.
          </p>
          <div className="hero-actions">
            <button className="button button-primary button-large" type="button" onClick={() => { window.location.href = "/register"; }}>
              Start an application
            </button>
              
          </div>
          <div className="trust-line">
            <span className="trust-icon"><Check className="w-3.5 h-3.5" /></span>
            <span>Clear status updates, secure documents and accessible support at every stage.</span>
          </div>
        </div>

        <div className="hero-visual">
          {/* Exported hero artwork. Decorative showcase of the applicant portal;
              the whole graphic links to the portal so it stays actionable, and the
              alt text carries its meaning for screen readers. Scales to the width
              of its column, so it fits any screen without overlapping content. */}
          <img
            className="hero-preview"
            src="/hero-preview.svg"
            alt=""
            aria-hidden="true"
            width="589"
            height="667"
          />
        </div>
      </div>

      <section className="search-section" id="courses" aria-labelledby="course-search-title">
        <div className="section-heading section-heading-split">
          <div>
            <p className="eyebrow">Explore before you apply</p>
            <h2 id="course-search-title">Find the right course</h2>
          </div>
          <p>Compare programmes, entry requirements, fees and application deadlines without creating an account.</p>
        </div>
        <form className="course-search" onSubmit={handleSearchSubmit}>
          <label className="sr-only" htmlFor="course-query">Search courses or subjects</label>
          <span className="search-symbol" aria-hidden="true"><Search className="w-4 h-4" /></span>
          <input
            id="course-query"
            type="search"
            placeholder="Search courses or subjects"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="button button-primary" type="submit">Search courses</button>
        </form>
        <div className="popular-searches" aria-label="Popular searches">
          <span>Popular:</span>
          <button type="button" onClick={() => setScreen("courses")}>Computer science</button>
          <button type="button" onClick={() => setScreen("courses")}>Business</button>
          <button type="button" onClick={() => setScreen("courses")}>Data science</button>
          <button type="button" onClick={() => setScreen("courses")}>Maritime</button>
        </div>
      </section>

      <section className="editorial-section" id="how-it-works" aria-labelledby="how-title">
        <div className="section-heading centered-heading">
          <p className="eyebrow">A guided application journey</p>
          <h2 id="how-title">Complex decisions, made easier to navigate</h2>
          <p>UAAMS keeps the process visible so applicants and university teams always understand the current stage and next responsibility.</p>
        </div>
        <div className="steps-grid">
          <article className="editorial-step">
            <div className="step-number" aria-hidden="true">01</div>
            <h3>Discover your options</h3>
            <p>Explore participating universities and compare course requirements before signing in.</p>
          </article>
          <article className="editorial-step">
            <div className="step-number" aria-hidden="true">02</div>
            <h3>Build your application</h3>
            <p>Complete clear sections, save your progress and review every answer before submitting.</p>
          </article>
          <article className="editorial-step">
            <div className="step-number" aria-hidden="true">03</div>
            <h3>Track every outcome</h3>
            <p>Respond to requests, follow reviews and receive decisions in one secure place.</p>
          </article>
          <article className="editorial-step">
            <div className="step-number" aria-hidden="true">04</div>
            <h3>Payments</h3>
            <p style={{ marginTop: "10px", color: "var(--muted)", fontSize: "14px" }}>
              Supported funding includes self-funding, Student Finance, scholarships, apprenticeship, and sponsor-invoiced payments.
            </p>
          </article>
        </div>
      </section>

      <section className="institutions-section" id="universities" aria-labelledby="institutions-title">
        <div className="section-heading section-heading-split">
          <div>
            <p className="eyebrow light-eyebrow">Participating institutions</p>
            <h2 id="institutions-title">Study somewhere that moves you forward.</h2>
          </div>
        </div>
        <div className="institution-list">
          {/* #25: was a hard-coded single institution. Renders the whole
              catalogue now, so a new university appears here automatically. */}
          {UNIVERSITIES.map((uni) => (
              <article key={uni.id || uni.name}>
                <span className="institution-mark">{uni.code || uni.name.substring(0, 2).toUpperCase()}</span>
                <div>
                  <h3>{uni.name}</h3>
                  <p>{uni.city || uni.location || "United Kingdom"} · {coursesForUniversity(uni.id).length} courses</p>
                </div>
                <button className="institution-link" type="button" onClick={() => setScreen("universities")}>
                  View university <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
        </div>
      </section>

      <section className="support-strip" id="support">
        <div>
          <p className="eyebrow">Help when you need it</p>
          <h2>Questions about applying?</h2>
          <p>Read clear guidance or contact the UAAMS support team.</p>
        </div>
        <div className="support-actions">
          <button className="button button-secondary" type="button" onClick={() => setScreen("support")}>
            Visit the help centre
          </button>
          <button className="text-link" type="button" onClick={() => setScreen("support")}>
            Contact support <span>→</span>
          </button>
        </div>
      </section>
    </section>
  );
}
