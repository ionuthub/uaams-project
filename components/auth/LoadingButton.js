// components/auth/LoadingButton.js
// Design-system button with a loading state (spinner + disabled). Uses the
// global .button / .button-* classes from app/globals.css so every screen
// shares one button implementation. Pass `variant` to pick the look and
// `full` (default true) for a full-width button.

const VARIANTS = {
  primary: "button-primary",
  secondary: "button-secondary",
  dark: "button-dark",
  quiet: "button-quiet",
  danger: "button-danger",
};

export default function LoadingButton({
  loading,
  children,
  type = "submit",
  onClick,
  disabled,
  variant = "primary",
  full = true,
}) {
  const classes = ["button", VARIANTS[variant] || VARIANTS.primary];
  if (full) classes.push("button-full");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      aria-busy={loading}
      className={classes.join(" ")}
    >
      {loading && <span className="button-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
