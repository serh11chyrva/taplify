"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { SiteMessages } from "@/lib/i18n/en";
import { locales, type Language } from "@/lib/site-preferences";
import styles from "../landing.module.css";
import { saveLanguage } from "./preference-actions";
import { usePreference } from "./use-preference";

export function LanguageMenu({ value, copy }: {
  value: Language;
  copy: SiteMessages["preferences"];
}) {
  const { selected, pending, failed, change } = usePreference(value, saveLanguage);
  const [open, setOpen] = useState(false);
  const control = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const labelId = `${menuId}-label`;
  const valueId = `${menuId}-value`;
  const options = [{ value: "auto" as const, label: copy.automatic }, ...locales];
  const current = options.find((option) => option.value === selected) ?? options[0];

  useEffect(() => {
    if (!open) return;

    menu.current?.querySelector("button")?.focus();
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !control.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [open]);

  function closeMenu() {
    trigger.current?.focus({ preventScroll: true });
    setOpen(false);
  }

  function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!open || !menu.current) return;

    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
      closeMenu();
      return;
    }

    const buttons = Array.from(menu.current.querySelectorAll("button"));
    const index = buttons.findIndex((button) => button === document.activeElement);
    let next: number;

    switch (event.key) {
      case "ArrowDown":
        next = (index + 1) % buttons.length;
        break;
      case "ArrowUp":
        next = (index <= 0 ? buttons.length : index) - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = buttons.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <div className={styles.preference}>
      <div
        ref={control}
        className={styles.languageControl}
        onKeyDown={handleMenuKey}
        onBlur={(event) => {
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <button
          ref={trigger}
          type="button"
          className={styles.languageTrigger}
          aria-labelledby={`${labelId} ${valueId}`}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-expanded={open}
          aria-busy={pending}
          aria-disabled={pending}
          onClick={() => { if (!pending) setOpen(!open); }}
        >
          <span id={labelId} className="sr-only">{copy.language}</span>
          <Globe aria-hidden="true" />
          <span id={valueId} lang={current.value === "auto" ? undefined : current.value}>{current.label}</span>
          <ChevronDown className={styles.languageChevron} aria-hidden="true" />
        </button>
        <div ref={menu} className={styles.languageMenu} id={menuId} role="menu" aria-labelledby={labelId} hidden={!open}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              className={styles.languageOption}
              lang={option.value === "auto" ? undefined : option.value}
              aria-checked={selected === option.value}
              tabIndex={-1}
              onClick={() => {
                closeMenu();
                change(option.value);
              }}
            >
              {option.label}
              {selected === option.value && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      {failed && <p className={styles.preferenceError} role="alert">{copy.saveError}</p>}
    </div>
  );
}
