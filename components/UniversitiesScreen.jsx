"use client";

import PublicHeader from "./PublicHeader";

export default function UniversitiesScreen({ setScreen, universities, user, onSignOut }) {
  return (
    <section className="screen directory-screen is-active" data-screen="universities">
      <PublicHeader setScreen={setScreen} currentScreen="universities" user={user} onSignOut={onSignOut} />

      <div className="directory-hero compact-directory-hero">
        <p className="eyebrow">Participating institutions</p>
        <h1 id="universities-title">Compare universities with clarity.</h1>
        <p>Explore locations, programmes and student support before beginning an application.</p>
      </div>

      <div className="university-directory">
        <article className="university-feature">
          <div className="campus-art">
            <img src="/assets/campuses/ashworth-campus.webp" alt="Ashworth University's Leeds campus" />
          </div>
          <div>
            <p className="micro-label">Leeds · Established 1964</p>
            <h2>Ashworth University</h2>
            <p>Technology-led teaching, close industry partnerships and a supportive international community.</p>
            <ul className="university-facts">
              <li><strong>42</strong><span>Courses available</span></li>
              <li><strong>Campus-based</strong><span>Study experience</span></li>
              <li><strong>Available</strong><span>Scholarship support</span></li>
            </ul>
            <button className="button button-secondary" type="button" onClick={() => setScreen("courses")}>
              Explore courses
            </button>
          </div>
        </article>

        <article className="university-feature">
          <div className="campus-art">
            <img src="/assets/campuses/harborview-campus.webp" alt="Harborview University's Bristol campus" />
          </div>
          <div>
            <p className="micro-label">Bristol · Established 1908</p>
            <h2>Harborview University</h2>
            <p>Research-informed programmes beside one of the UK's most creative and connected cities.</p>
            <ul className="university-facts">
              <li><strong>31</strong><span>Courses available</span></li>
              <li><strong>Integrated</strong><span>Placement options</span></li>
              <li><strong>Waterside</strong><span>City campus</span></li>
            </ul>
            <button className="button button-secondary" type="button" onClick={() => setScreen("courses")}>
              Explore courses
            </button>
          </div>
        </article>

        <article className="university-feature">
          <div className="campus-art">
            <img src="/assets/campuses/st-eddas-campus.webp" alt="St Edda's historic collegiate courtyard in York" />
          </div>
          <div>
            <p className="micro-label">York · Established 1881</p>
            <h2>St Edda's College</h2>
            <p>A close-knit academic community with tutorial-led teaching and specialist programmes.</p>
            <ul className="university-facts">
              <li><strong>18</strong><span>Courses available</span></li>
              <li><strong>Tutorial-led</strong><span>Collegiate teaching</span></li>
              <li><strong>Historic</strong><span>York campus</span></li>
            </ul>
            <button className="button button-secondary" type="button" onClick={() => setScreen("courses")}>
              Explore courses
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
