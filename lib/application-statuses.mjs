export const APPLICATION_STATUS_CONFIG = Object.freeze({
  draft: { label: "Draft", className: "badgeDraft" },
  submitted: { label: "Submitted", className: "badgeSubmitted" },
  under_review: { label: "Under review", className: "badgeUnderReview" },
  offer: { label: "Offer", className: "badgeOffer" },
  rejected: { label: "Rejected", className: "badgeRejected" },
});

export function getApplicationStatusConfig(status) {
  return APPLICATION_STATUS_CONFIG[status] || {
    label: status || "Unknown",
    className: "badgeDefault",
  };
}
