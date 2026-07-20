"use client";

export default function PublicFooter({ setScreen, onOpenModal }) {
  return (
    <footer className="public-footer" data-public-footer>
      <div className="footer-primary">
        <div className="footer-brand">
          <span className="brand-mark light-mark">U</span>
          <div>
            <strong>UAAMS</strong>
            <p>A clear and secure university application service.</p>
          </div>
        </div>
        <div>
          <h2>Explore</h2>
          <button type="button" onClick={() => setScreen("universities")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "block", marginBottom: "8px" }}>
            Universities
          </button>
          <button type="button" onClick={() => setScreen("courses")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "block", marginBottom: "8px" }}>
            Courses
          </button>
          <button
            type="button"
            onClick={() => {
              setScreen("landing");
              setTimeout(() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "block" }}
          >
            How it works
          </button>
        </div>
        <div>
          <h2>Support</h2>
          <button type="button" onClick={() => setScreen("support")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "block", marginBottom: "8px" }}>
            Help centre
          </button>
          <button type="button" onClick={() => onOpenModal("contact")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "block", marginBottom: "8px" }}>
            Contact us
          </button>
        </div>
        <div>
          <h2>Legal</h2>
          <button type="button" onClick={() => onOpenModal("privacy")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "block", marginBottom: "8px" }}>
            Privacy notice
          </button>
          <button type="button" onClick={() => onOpenModal("accessibility")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "block", marginBottom: "8px" }}>
            Accessibility
          </button>
          <button type="button" onClick={() => onOpenModal("cookies")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "block" }}>
            Cookie preferences
          </button>
        </div>
      </div>
      <div className="footer-secondary">
        <span>© 2026 UAAMS integrated platform</span>
        <span>Designed to WCAG 2.2 AA principles</span>
      </div>
    </footer>
  );
}
