"use client";

export default function GlobalModals({ activeModal, onCloseModal, notify }) {
  if (!activeModal) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onCloseModal} aria-hidden="true" />

      {activeModal === "contact" && (
        <dialog className="modal" open role="dialog" aria-labelledby="contact-modal-title">
          <form onSubmit={(e) => { e.preventDefault(); notify("Message Sent", "Support team will respond within 24h."); onCloseModal(); }}>
            <header>
              <div><p className="micro-label">UAAMS support</p><h2 id="contact-modal-title">Send us a message</h2></div>
              <button type="button" onClick={onCloseModal} aria-label="Close message dialog">×</button>
            </header>
            <div className="modal-body">
              <label htmlFor="contact-topic">Topic
                <select id="contact-topic">
                  <option>Application question</option>
                  <option>Documents</option>
                  <option>Payment</option>
                  <option>Account access</option>
                </select>
              </label>
              <label htmlFor="contact-msg">Your message
                <textarea id="contact-msg" rows="5" required placeholder="Describe your question..." />
              </label>
            </div>
            <footer>
              <button className="button button-quiet" type="button" onClick={onCloseModal}>Cancel</button>
              <button className="button button-primary" type="submit">Send message</button>
            </footer>
          </form>
        </dialog>
      )}

      {activeModal === "privacy" && (
        <dialog className="modal legal-modal" open role="dialog" aria-labelledby="privacy-modal-title">
          <form method="dialog">
            <header>
              <div><p className="micro-label">Legal information</p><h2 id="privacy-modal-title">Privacy notice</h2></div>
              <button type="button" onClick={onCloseModal} aria-label="Close privacy notice">×</button>
            </header>
            <div className="modal-body legal-copy">
              <p>UAAMS uses applicant information to manage applications, payments, evidence requests and university decisions.</p>
              <h3>Your information</h3>
              <p>Access is limited by role and university scope. Application activity is recorded for security, support and audit purposes.</p>
            </div>
            <footer>
              <button className="button button-primary" type="button" onClick={onCloseModal}>Close</button>
            </footer>
          </form>
        </dialog>
      )}

      {activeModal === "accessibility" && (
        <dialog className="modal legal-modal" open role="dialog" aria-labelledby="access-modal-title">
          <form method="dialog">
            <header>
              <div><p className="micro-label">Service commitment</p><h2 id="access-modal-title">Accessibility</h2></div>
              <button type="button" onClick={onCloseModal} aria-label="Close accessibility statement">×</button>
            </header>
            <div className="modal-body legal-copy">
              <p>UAAMS is designed around WCAG 2.2 AA principles, including keyboard access, visible focus, meaningful structure and non-colour status labels.</p>
            </div>
            <footer>
              <button className="button button-primary" type="button" onClick={onCloseModal}>Close</button>
            </footer>
          </form>
        </dialog>
      )}

      {activeModal === "cookies" && (
        <dialog className="modal legal-modal" open role="dialog" aria-labelledby="cookies-modal-title">
          <form onSubmit={(e) => { e.preventDefault(); notify("Preferences Saved", "Cookie preferences updated."); onCloseModal(); }}>
            <header>
              <div><p className="micro-label">Your preferences</p><h2 id="cookies-modal-title">Cookie preferences</h2></div>
              <button type="button" onClick={onCloseModal} aria-label="Close cookie preferences">×</button>
            </header>
            <div className="modal-body">
              <label className="check-row" htmlFor="cookies-essential">
                <input id="cookies-essential" type="checkbox" checked disabled /> Essential cookies <small>Required for secure sign-in and application progress.</small>
              </label>
              <label className="check-row" htmlFor="cookies-analytics">
                <input id="cookies-analytics" type="checkbox" /> Experience analytics <small>Helps improve navigation and service performance.</small>
              </label>
            </div>
            <footer>
              <button className="button button-quiet" type="button" onClick={onCloseModal}>Cancel</button>
              <button className="button button-primary" type="submit">Save preferences</button>
            </footer>
          </form>
        </dialog>
      )}
    </>
  );
}
