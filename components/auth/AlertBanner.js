// components/auth/AlertBanner.js
// Success/error/info banner for the async UI states (idle, loading, success,
// error) used across the product. Styling: Tailwind utilities built from the
// shared status tokens. The text prefix carries the meaning, so the state is
// never communicated by colour alone.

const BASE = "rounded-md border px-[0.9rem] py-[0.7rem] text-sm";

const VARIANT_CLASS = {
  success: "border-success/35 bg-success-bg text-success",
  error: "border-error/35 bg-error-bg text-error",
  info: "border-info/35 bg-info-bg text-info",
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
      className={BASE + " " + (VARIANT_CLASS[variant] || VARIANT_CLASS.info)}
    >
      <strong>{VARIANT_PREFIX[variant]} </strong>
      {children}
    </div>
  );
}
