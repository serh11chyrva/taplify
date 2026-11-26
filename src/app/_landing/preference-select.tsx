"use client";

import { ChevronDown } from "lucide-react";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import styles from "../landing.module.css";

export function PreferenceSelect({ label, value, options, icon, saveAction }: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  icon: ReactNode;
  saveAction: (value: string) => Promise<void>;
}) {
  const [selected, setSelected] = useOptimistic(value);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function change(next: string) {
    setFailed(false);
    startTransition(async () => {
      setSelected(next);
      try {
        await saveAction(next);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className={styles.preference}>
      <div className={styles.preferenceControl}>
        <span className={styles.preferenceIcon} aria-hidden="true">{icon}</span>
        <select
          className={styles.preferenceSelect}
          aria-label={label}
          aria-busy={pending}
          value={selected}
          onChange={(event) => change(event.currentTarget.value)}
        >
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown className={styles.preferenceChevron} aria-hidden="true" />
      </div>
      {failed && <p className={styles.preferenceError} role="alert">Could not save this preference.</p>}
    </div>
  );
}
