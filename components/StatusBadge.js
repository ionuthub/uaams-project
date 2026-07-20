// components/StatusBadge.js
// Maps lib/db.js APPLICATION_STATUSES to a plain-language label and a
// colour. Status is always readable as text, per WCAG "not by colour alone".
import styles from "./StatusBadge.module.css";

const STATUS_META = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "warning" },
  offer: { label: "Offer made", tone: "success" },
  rejected: { label: "Not successful", tone: "error" },
};

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: "neutral" };
  return <span className={`${styles.badge} ${styles[meta.tone]}`}>{meta.label}</span>;
}
