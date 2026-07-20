"use client";

import PublicHeader from "./PublicHeader";
import { SOLENT, coursesForUniversity } from "../lib/course-catalog.mjs";

// Public visitors cannot read the /universities collection (the security
// rules require sign in), so the public directory renders the participating
// university from lib/course-catalog.mjs, which mirrors the seeded record.
// Signed in flows such as the apply form still read Firestore directly.

const PUBLIC_UNIVERSITIES = [
  { id: SOLENT.id, name: SOLENT.name, city: SOLENT.city },
];

export default function UniversitiesScreen({ setScreen, user, onSignOut }) {
  const universities = PUBLIC_UNIVERSITIES;
  return (
    <section className="screen directory-screen is-active" data-screen="universities">
      <PublicHeader setScreen={setScreen} currentScreen="universities" user={user} onSignOut={onSignOut} />

      <div className="directory-hero compact-directory-hero">
        <p className="eyebrow">Participating institutions</p>
        <h1 id="universities-title">Study somewhere that moves you forward.</h1>
        <p>Explore the participating university, its programmes and student support before beginning an application.</p>
      </div>

      <div className="university-directory">
        {universities.map((uni) => {
            const isSolent = uni.id === SOLENT.id;
            const courseCount = coursesForUniversity(uni.id).length;
            return (
              <article className="university-feature" key={uni.id}>
                <div className="campus-art">
                  <img
                    src={SOLENT.campusImage}
                    alt={isSolent ? SOLENT.campusAlt : `${uni.name} campus`}
                  />
                </div>
                <div>
                  <p className="micro-label">{isSolent ? SOLENT.statusLine : uni.city || "United Kingdom"}</p>
                  <h2>{uni.name}</h2>
                  <p>{isSolent ? SOLENT.blurb : "Participating university on the UAAMS service."}</p>
                  <ul className="university-facts">
                    <li><strong>{courseCount || "New"}</strong><span>{courseCount ? "Courses listed" : "Catalogue coming soon"}</span></li>
                    <li><strong>Campus based</strong><span>Study experience</span></li>
                    <li><strong>{uni.city || "UK"}</strong><span>City campus</span></li>
                  </ul>
                  <button className="button button-secondary" type="button" onClick={() => setScreen("courses")}>
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
