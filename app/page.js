import Link from "next/link";
import styles from "./page.module.css";

const currentCapabilities = [
  "Applicant registration and email-verification guidance",
  "Login and password-reset screens",
  "Firebase authentication and university-scoped data helpers",
  "Vercel preview and production deployment pipeline",
];

const sprintWork = [
  "Student dashboard and application form",
  "Document upload through Firebase Storage",
  "Admissions list, detail, scoping and decision screens",
  "Decision email integration and end-to-end evidence",
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>University Administration and Application Management System</p>
        <h1>One application journey, clearly managed.</h1>
        <p className={styles.summary}>
          UAAMS is a Sprint 2 proof of concept for applicant identity, university applications,
          admissions decisions and status communication.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/register">
            Create applicant account
          </Link>
          <Link className={styles.secondaryAction} href="/login">
            Log in
          </Link>
        </div>
      </section>

      <section className={styles.grid} aria-label="Project status">
        <article className={styles.card}>
          <p className={styles.cardLabel}>Available now</p>
          <h2>Foundation increment</h2>
          <ul>
            {currentCapabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <p className={styles.cardLabel}>Active Sprint work</p>
          <h2>Core application journey</h2>
          <ul>
            {sprintWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <p className={styles.notice}>
        This is an educational proof of concept. Do not enter real personal or financial information.
      </p>
    </main>
  );
}
