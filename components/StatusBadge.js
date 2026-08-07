// components/StatusBadge.js
// Maps lib/db.js APPLICATION_STATUSES to a plain-language label and a tone.
// Status is always readable as text, per WCAG "not by colour alone".
//
// Uses the global .status / .status-* classes from app/globals.css so every
// badge in the product is styled from one place. STATUS_META is exported so
// pages reuse these labels instead of keeping their own copy, which is what
// previously let the student dashboard and the admin badge drift apart.

export const STATUS_META = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "warning" },
  offer: { label: "Offer made", tone: "success" },
  rejected: { label: "Not successful", tone: "error" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

export function statusMeta(status) {
  return STATUS_META[status] || { label: status, tone: "neutral" };
}

export default function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return <span className={"status status-" + meta.tone}>{meta.label}</span>;
}
