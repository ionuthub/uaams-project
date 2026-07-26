// components/auth/LoadingButton.js
// Design-system button with a loading state (spinner + disabled). Now built on
// React Aria's Button for accessible press handling (pointer + keyboard),
// while keeping the global .button / .button-* classes so the look is unchanged.
// Pass `variant` to pick the look and `full` (default true) for full width.

"use client";

import { Button } from "react-aria-components";

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
    <Button
      type={type}
      onPress={onClick}
      isDisabled={loading || disabled}
      aria-busy={loading}
      className={classes.join(" ")}
    >
      {loading && <span className="button-spinner" aria-hidden="true" />}
      {children}
    </Button>
  );
}
