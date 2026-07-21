// components/auth/AuthCard.js
// Added for #8. Shared responsive shell for every auth screen.
// Updated: added a minimal site header (brand mark, name, back-to-home link)
// so the standalone auth routes are not blank pages with no navigation.

import styles from "./auth.module.css";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <>
      <header className={styles.authTopBar}>
        <a href="/" className={styles.authBrand} aria-label="UAAMS home">
          <span className={styles.authBrandMark} aria-hidden="true">U</span>
          <span className={styles.authBrandName}>UAAMS</span>
        </a>
        <a href="/" className={styles.authBackLink}>
          ← Back to home
        </a>
      </header>
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.body}>{children}</div>
        </div>
      </main>
    </>
  );
}
