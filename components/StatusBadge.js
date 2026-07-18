// components/StatusBadge.js
// Prepared for #9 (Week 2 student dashboard) - not wired into anything yet.
// Small, reusable status pill matching db.js's APPLICATION_STATUSES
// (draft, submitted, under_review, offer, rejected). Kept text + colour
// together (not colour alone) per NFR4 accessibility, same principle as
// the auth screens' AlertBanner.

import styles from "./StatusBadge.module.css";
import { getApplicationStatusConfig } from "../lib/application-statuses.mjs";

export default function StatusBadge({ status }) {
  const config = getApplicationStatusConfig(status);
  return (
    <span className={`${styles.badge} ${styles[config.className] || ""}`}>
      {config.label}
    </span>
  );
}
