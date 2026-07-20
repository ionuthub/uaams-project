"use client";

import { useState } from "react";
import PublicHeader from "./PublicHeader";
import { Search, Heart } from "lucide-react";

export default function CoursesScreen({ setScreen, user, onSignOut, onSelectCourse }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [savedCourses, setSavedCourses] = useState({});

  const courses = [
    {
      id: "cs-ashworth",
      title: "BSc (Hons) Computer Science",
      university: "Ashworth University",
      code: "AU",
      location: "Leeds",
      level: "Undergraduate",
      mode: "Full time",
      duration: "3 years",
      deadline: "31 Jan 2027",
      subject: "computing",
      description: "Build strong foundations in software engineering, data structures and responsible computing."
    },
    {
      id: "ds-ashworth",
      title: "MSc Data Science",
      university: "Ashworth University",
      code: "AU",
      location: "Leeds",
      level: "Postgraduate",
      mode: "Full time",
      duration: "1 year",
      deadline: "30 Apr 2027",
      subject: "data-science",
      description: "Combine statistics, machine learning and real-world analytics in an industry-led programme."
    },
    {
      id: "bm-harborview",
      title: "BA Business Management",
      university: "Harborview University",
      code: "HU",
      location: "Bristol",
      level: "Undergraduate",
      mode: "Full time",
      duration: "3 years",
      deadline: "31 Jan 2027",
      subject: "business",
      description: "Develop commercial judgment through live briefs, placements and global business perspectives."
    }
  ];

  const filteredCourses = courses.filter((c) => {
    const matchesQuery = searchQuery === "" ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(c.level.toLowerCase());
    return matchesQuery && matchesLevel;
  });

  const toggleSave = (id) => {
    setSavedCourses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="screen directory-screen is-active" data-screen="courses">
      <PublicHeader setScreen={setScreen} currentScreen="courses" user={user} onSignOut={onSignOut} />

      <div className="directory-hero">
        <p className="eyebrow">Explore programmes</p>
        <h1 id="courses-title">Find a course that fits your ambition.</h1>
        <p>Compare entry requirements, study modes and application deadlines across participating universities.</p>
        <form className="directory-search" onSubmit={(e) => e.preventDefault()}>
          <span className="directory-search-icon"><Search className="w-4 h-4" /></span>
          <input
            type="search"
            aria-label="Search courses, subjects or universities"
            placeholder="Course, subject or university"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="button button-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="directory-layout">
        <aside className="filter-panel">
          <div className="filter-heading">
            <strong>Filters</strong>
            <button className="text-button" type="button" onClick={() => { setSearchQuery(""); setSelectedLevels([]); }}>
              Clear all
            </button>
          </div>
          <fieldset>
            <legend>Study level</legend>
            <label>
              <input
                type="checkbox"
                checked={selectedLevels.includes("undergraduate")}
                onChange={(e) => {
                  if (e.target.checked) setSelectedLevels([...selectedLevels, "undergraduate"]);
                  else setSelectedLevels(selectedLevels.filter((l) => l !== "undergraduate"));
                }}
              /> Undergraduate
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedLevels.includes("postgraduate")}
                onChange={(e) => {
                  if (e.target.checked) setSelectedLevels([...selectedLevels, "postgraduate"]);
                  else setSelectedLevels(selectedLevels.filter((l) => l !== "postgraduate"));
                }}
              /> Postgraduate
            </label>
          </fieldset>
        </aside>

        <div className="results-panel">
          <div className="results-heading">
            <div>
              <p className="micro-label" aria-live="polite">{filteredCourses.length} programmes</p>
              <h2>Courses open for application</h2>
            </div>
          </div>

          <div className="course-grid">
            {filteredCourses.map((c) => (
              <article key={c.id} className="course-card">
                <div className="course-card-top">
                  <span className="institution-mark">{c.code}</span>
                  <button
                    type="button"
                    aria-label={`Save ${c.title}`}
                    className={`save-button ${savedCourses[c.id] ? "is-saved" : ""}`}
                    onClick={() => toggleSave(c.id)}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <Heart className="w-5 h-5" fill={savedCourses[c.id] ? "#e11d48" : "none"} color={savedCourses[c.id] ? "#e11d48" : "currentColor"} />
                  </button>
                </div>
                <p className="micro-label">{c.university} · {c.location}</p>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <dl>
                  <div><dt>Level</dt><dd>{c.level}</dd></div>
                  <div><dt>Duration</dt><dd>{c.duration}</dd></div>
                  <div><dt>Deadline</dt><dd>{c.deadline}</dd></div>
                </dl>
                <button
                  className="text-link"
                  type="button"
                  onClick={() => {
                    onSelectCourse(c);
                    setScreen("course-detail");
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                >
                  View course <span>→</span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
