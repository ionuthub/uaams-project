// components/auth/FormField.js
// Added for #8. Labelled input with an accessibly-linked error message
// (NFR4 - explicit <label>, error text tied to the input via
// aria-describedby, not colour alone).

import styles from "./auth.module.css";

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
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${styles.input} ${error ? styles.inputError : ""} ${className || ""}`}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className={styles.errorText}>
          {error}
        </p>
      )}
    </div>
  );
}
