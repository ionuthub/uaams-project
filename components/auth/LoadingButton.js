// components/auth/LoadingButton.js
// Added for #8. Submit button that visibly reflects the loading state
// (spinner + disabled) rather than leaving students unsure whether their
// click registered.

import styles from "./auth.module.css";

export default function LoadingButton({
  loading,
  children,
  type = "submit",
  onClick,
  disabled,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      aria-busy={loading}
      className={styles.button}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
