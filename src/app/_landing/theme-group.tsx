"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { SiteMessages } from "@/lib/i18n/en";
import { themes } from "@/lib/site-preferences";
import styles from "../landing.module.css";
import { saveTheme } from "./preference-actions";
import { usePreference } from "./use-preference";

const icons = { system: Monitor, dark: Moon, light: Sun };

export function ThemeGroup({ value, copy }: {
  value: (typeof themes)[number];
  copy: SiteMessages["preferences"];
}) {
  const { selected, pending, failed, change } = usePreference(value, saveTheme);

  return (
    <div className={styles.preference}>
      <ButtonGroup className={styles.themeGroup} aria-label={copy.theme} aria-busy={pending}>
        {themes.map((theme) => {
          const Icon = icons[theme];
          return (
            <Button
              key={theme}
              type="button"
              variant="outline"
              size="icon"
              className={styles.themeButton}
              title={copy[theme]}
              aria-label={copy[theme]}
              aria-pressed={selected === theme}
              aria-disabled={pending}
              onClick={() => change(theme)}
            >
              <Icon aria-hidden="true" />
            </Button>
          );
        })}
      </ButtonGroup>
      {failed && <p className={styles.preferenceError} role="alert">{copy.saveError}</p>}
    </div>
  );
}
