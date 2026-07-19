// components/dashboard/ApplicationTimeline.js
// Visualises the real application lifecycle (lib/db.js APPLICATION_STATUSES).
// Does NOT show the prototype's payment/finance-check stages - those
// collections don't exist in the deployed Firestore model (schema doc #23
// is still pending Dawid's technical confirmation; build against the code,
// not the draft diagram, until that's resolved).
import styles from "./ApplicationTimeline.module.css";

const STAGES = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under review" },
  { key: "decision", label: "Decision" },
];

function stageIndex(status) {
  if (status === "submitted") return 0;
  if (status === "under_review") return 1;
  if (status === "offer" || status === "rejected") return 2;
  return -1;
}

export default function ApplicationTimeline({ status }) {
  const current = stageIndex(status);
  if (current === -1) return null; // draft: nothing submitted yet

  return (
    <ol className={styles.timeline} aria-label="Application progress">
      {STAGES.map((stage, i) => {
        const isDecision = stage.key === "decision";
        const label =
          isDecision && status === "offer"
            ? "Offer made"
            : isDecision && status === "rejected"
            ? "Not successful"
            : stage.label;
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <li key={stage.key} className={`${styles.step} ${styles[state]}`}>
            <span className={styles.dot} aria-hidden="true">{state === "done" ? "✓" : i + 1}</span>
            <span className={styles.label}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
