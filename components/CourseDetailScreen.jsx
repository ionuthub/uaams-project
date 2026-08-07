"use client";

import { Heart } from "lucide-react";
import { ALL_COURSES } from "../lib/course-catalog.mjs";

// Course detail rendered entirely from the catalogue entry the visitor
// selected (lib/course-catalog.mjs). Refreshing or deep-linking without a
// selection falls back to the first real catalogue course rather than a
// placeholder from the old prototype.

export default function CourseDetailScreen({ setScreen, selectedCourse, user, onStartApplication }) {
  const course = selectedCourse || ALL_COURSES[0];

  return (
    <section className="screen directory-screen is-active" data-screen="course-detail">
      <header className="directory-header">
        <button className="brand" type="button" onClick={() => setScreen("landing")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <span className="brand-mark">U</span>
          <span className="brand-name">UAAMS</span>
        </button>
        <button className="back-link" type="button" onClick={() => setScreen("courses")} style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}>
          ← All courses
        </button>
        <button className="button button-quiet" type="button" onClick={() => { window.location.href = "/login"; }}>
          Sign in
        </button>
      </header>

      <div className="course-detail-hero">
        <div>
          <p className="eyebrow">{course.university} · {course.school}</p>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="hero-actions">
            <button
              className="button button-primary button-large"
              type="button"
              onClick={() => onStartApplication(course)}
            >
              Start application
            </button>
            <button className="button button-secondary button-large course-save-button" type="button">
              <Heart className="w-4 h-4" />
              <span>Save course</span>
            </button>
          </div>
        </div>

        <aside>
          <span className="institution-mark">{course.code}</span>
          <h2>Course at a glance</h2>
          <dl>
            <div><dt>Study mode</dt><dd>{course.mode}</dd></div>
            <div><dt>Duration</dt><dd>{course.duration}</dd></div>
            <div><dt>Start date</dt><dd>{course.start}</dd></div>
            <div><dt>Application fee</dt><dd>{course.fee}</dd></div>
          </dl>
        </aside>
      </div>

      <div className="course-detail-body">
        <article>
          <section id="course-overview">
            <p className="eyebrow">Programme overview</p>
            <h2>What you will study</h2>
            <p>{course.overview}</p>
            <div className="module-grid">
              {course.modules.map((block) => (
                <div key={block.heading}>
                  <strong>{block.heading}</strong>
                  {block.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section id="course-requirements" style={{ marginTop: "32px" }}>
            <p className="eyebrow">Entry requirements</p>
            <h2>What you will need</h2>
            <ul className="entry-requirements-list">
              {course.entryRequirements.map((requirement) => (
                <li key={requirement.label}>
                  <span>{requirement.label}</span>
                  <strong>{requirement.value}</strong>
                  <p>{requirement.note}</p>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="deadline-card">
          <p className="micro-label">Applications open</p>
          <h2>{course.start} entry</h2>
          <p>Apply by <strong>{course.deadline}</strong> for equal consideration.</p>
          <button
            className="button button-dark button-full"
            type="button"
            onClick={() => {
              if (user) onStartApplication(course);
              else window.location.href = "/register";
            }}
          >
            Begin application
          </button>
        </aside>
      </div>
    </section>
  );
}
