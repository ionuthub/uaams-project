// components/StatusBadge.js
// Prepared for #9 (Week 2 student dashboard) - not wired into anything yet.
// Small, reusable status pill matching db.js's APPLICATION_STATUSES
// (draft, submitted, under_review, offer, rejected). Kept text + colour
// together (not colour alone) per NFR4 accessibility, same principle as
// the auth screens' AlertBanner.

import styles from "./StatusBadge.module.css";

const STATUS_CONFIG = {
  draft: { label: "Draft", className: "badgeDraft" },
  submitted: { label: "Submitted", className: "badgeSubmitted" },
  under_review: { label: "Under review", className: "badgeUnderReview" },
  offer: { label: "Offer", className: "badgeOffer" },
  rejected: { label: "Rejected", className: "badgeRejected" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "badgeDefault" };
  return (
    <span className={`${styles.badge} ${styles[config.className] || ""}`}>
      {config.label}
    </span>
  );
}
