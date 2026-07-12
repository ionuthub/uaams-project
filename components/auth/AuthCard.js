// components/auth/AuthCard.js
// Added for #8. Shared responsive shell for every auth screen.

import styles from "./auth.module.css";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}
