"use client";

import { Heart } from "lucide-react";

export default function CourseDetailScreen({ setScreen, selectedCourse, user, onStartApplication }) {
  const course = selectedCourse || {
    title: "BSc (Hons) Computer Science",
    university: "Ashworth University",
    school: "School of Computing",
    description: "Learn to design dependable software, understand intelligent systems and solve meaningful problems through computing.",
    mode: "Full time",
    duration: "3 years",
    start: "September 2027",
    fee: "£25"
  };

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
          <p className="eyebrow">{course.university} · {course.school || "School of Computing"}</p>
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
          <span className="institution-mark">{course.code || "AU"}</span>
          <h2>Course at a glance</h2>
          <dl>
            <div><dt>Study mode</dt><dd>{course.mode || "Full time"}</dd></div>
            <div><dt>Duration</dt><dd>{course.duration || "3 years"}</dd></div>
            <div><dt>Start date</dt><dd>{course.start || "September 2027"}</dd></div>
            <div><dt>Application fee</dt><dd>{course.fee || "£25"}</dd></div>
          </dl>
        </aside>
      </div>

      <div className="course-detail-body">
        <article>
          <section id="course-overview">
            <p className="eyebrow">Programme overview</p>
            <h2>Turn curiosity into practical capability.</h2>
            <p>Study programming, databases, software engineering, AI, cyber security and complete a final capstone project.</p>
            <div className="module-grid">
              <div><strong>Year one</strong><span>Programming foundations</span><span>Computer systems</span><span>Data & information</span></div>
              <div><strong>Year two</strong><span>Software engineering</span><span>Algorithms & AI</span><span>Team project</span></div>
              <div><strong>Year three</strong><span>Advanced topics</span><span>Cyber security</span><span>Individual project</span></div>
            </div>
          </section>

          <section id="course-requirements" style={{ marginTop: "32px" }}>
            <p className="eyebrow">Entry requirements</p>
            <h2>What you will need</h2>
            <ul className="entry-requirements-list">
              <li>
                <span>Academic qualifications</span>
                <strong>A-level BBB</strong>
                <p>Must include Mathematics or Computer Science.</p>
              </li>
              <li>
                <span>International applicants</span>
                <strong>Accepted equivalent qualification</strong>
                <p>Equivalent international secondary or diploma qualifications are accepted.</p>
              </li>
              <li>
                <span>English language</span>
                <strong>Evidence may be required</strong>
                <p>IELTS 6.5 or equivalent qualification required for non-native English speakers.</p>
              </li>
            </ul>
          </section>
        </article>

        <aside className="deadline-card">
          <p className="micro-label">Applications open</p>
          <h2>September 2027 entry</h2>
          <p>Apply by <strong>31 January 2027</strong> for equal consideration.</p>
          <button
            className="button button-dark button-full"
            type="button"
            onClick={() => {
              if (user) onStartApplication(course);
              else setScreen("register");
            }}
          >
            Begin application
          </button>
        </aside>
      </div>
    </section>
  );
}
