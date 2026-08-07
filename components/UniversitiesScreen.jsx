"use client";

import PublicHeader from "./PublicHeader";
import { UNIVERSITIES, coursesForUniversity } from "../lib/course-catalog.mjs";

// Public visitors cannot read the /universities collection (the security
// rules require sign in), so the public directory renders the participating
// institutions from lib/course-catalog.mjs, which mirrors the seeded records.
// Signed in flows such as the apply form still read Firestore directly.
//
// #25/#199: this used to hard-code a single institution and special-case
// "is this Solent?" throughout. Both universities now carry the same fields,
// so the special casing is gone and adding a third means adding one entry to
// the catalogue rather than editing this screen.

export default function UniversitiesScreen({ setScreen, user, onSignOut }) {
  const universities = UNIVERSITIES;
  const plural = universities.length > 1;

  return (
    <section className="screen directory-screen is-active" data-screen="universities">
      <PublicHeader setScreen={setScreen} currentScreen="universities" user={user} onSignOut={onSignOut} />

      <div className="directory-hero compact-directory-hero">
        <p className="eyebrow">Participating institutions</p>
        <h1 id="universities-title">Study somewhere that moves you forward.</h1>
        <p>
          Explore {plural ? "the participating universities" : "the participating university"}, their
          programmes and student support before beginning an application.
        </p>
      </div>

      <div className="university-directory">
        {universities.map((uni) => {
          const courseCount = coursesForUniversity(uni.id).length;
          return (
            <article className="university-feature" key={uni.id}>
              <div className="campus-art">
                <img src={uni.campusImage} alt={uni.campusAlt} />
              </div>
              <div>
                <p className="micro-label">{uni.statusLine || uni.city || "United Kingdom"}</p>
                <h2>{uni.name}</h2>
                <p>{uni.blurb || "Participating university on the UAAMS service."}</p>
                <ul className="university-facts">
                  <li>
                    <strong>{courseCount || "New"}</strong>
                    <span>{courseCount ? "Courses listed" : "Catalogue coming soon"}</span>
                  </li>
                  <li><strong>Campus based</strong><span>Study experience</span></li>
                  <li><strong>{uni.city || "UK"}</strong><span>City campus</span></li>
                </ul>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setScreen("courses")}
                  aria-label={`Explore courses at ${uni.name}`}
                >
                  Explore courses
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
