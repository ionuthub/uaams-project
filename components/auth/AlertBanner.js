// components/auth/AlertBanner.js
// Added for #8. Success/error/info banner for the async UI states
// (idle/loading/success/error) required on every auth screen.

import styles from "./auth.module.css";

const VARIANT_CLASS = {
  success: styles.bannerSuccess,
  error: styles.bannerError,
  info: styles.bannerInfo,
};

const VARIANT_PREFIX = {
  success: "Success:",
  error: "Error:",
  info: "Note:",
};

export default function AlertBanner({ variant, children }) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`${styles.banner} ${VARIANT_CLASS[variant]}`}
    >
      <strong>{VARIANT_PREFIX[variant]} </strong>
      {children}
    </div>
  );
}
