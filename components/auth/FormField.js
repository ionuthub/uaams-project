// components/auth/FormField.js
// Labelled input with an accessibly-linked error message (NFR4: explicit
// <label>, error text tied to the input via aria-describedby, not colour
// alone). Styling: Tailwind utilities built from the shared design tokens.

const INPUT_BASE =
  "w-full box-border border rounded-md px-[0.7rem] py-[0.55rem] text-[0.9rem] text-ink focus:outline-none";
const INPUT_OK =
  "border-border-strong focus:border-blue-600 focus:shadow-[0_0_0_3px_var(--color-blue-100)]";
const INPUT_ERROR =
  "border-error focus:border-error focus:shadow-[0_0_0_3px_var(--color-error-bg)]";

export default function FormField({
  label,
  name,
  error,
  hint,
  className,
  ...inputProps
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={[INPUT_BASE, error ? INPUT_ERROR : INPUT_OK, className || ""].join(" ")}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-quiet">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
