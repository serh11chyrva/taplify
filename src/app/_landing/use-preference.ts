import { useOptimistic, useState, useTransition } from "react";

export function usePreference<T extends string>(value: T, saveAction: (value: T) => Promise<void>) {
  const [selected, setSelected] = useOptimistic(value);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function change(next: T) {
    if (pending || next === value) return;

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

  return { selected, pending, failed, change };
}
