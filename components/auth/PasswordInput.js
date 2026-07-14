// components/auth/PasswordInput.js
// Added for #8. Password field with a show/hide toggle and an optional
// live strength hint. Built on FormField so labelling/error wiring stays
// consistent everywhere.

"use client";

import { useState } from "react";
import FormField from "./FormField";
import { passwordStrength } from "../../lib/validation";
import styles from "./auth.module.css";

const STRENGTH_CLASS = {
  weak: styles.strengthWeak,
  medium: styles.strengthMedium,
  strong: styles.strengthStrong,
};

const STRENGTH_LABEL = {
  weak: "Weak",
  medium: "Okay",
  strong: "Strong",
};

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  error,
  showStrength = false,
  autoComplete = "new-password",
}) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength && value ? passwordStrength(value) : null;

  return (
    <div className={styles.passwordWrap}>
      <FormField
        label={label}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={styles.toggleVisibility}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
      {strength && (
        <p className={`${styles.strength} ${STRENGTH_CLASS[strength]}`}>
          Password strength: {STRENGTH_LABEL[strength]}
        </p>
      )}
    </div>
  );
}
