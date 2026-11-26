"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "../landing.module.css";
import { productLinks } from "./products";

export function ProductsMenu({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popupId = useId();

  useEffect(() => {
    if (!open) return;

    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (menu.current?.contains(document.activeElement)) trigger.current?.focus();
      setOpen(false);
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);

  return (
    <div
      ref={menu}
      className={styles.productsMenu}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.headerLink}
        aria-controls={popupId}
        aria-expanded={open}
        onClick={() => setOpen((expanded) => !expanded)}
      >
        {label}
      </button>
      <div className={styles.productsPopup} id={popupId} hidden={!open}>
        <ul className={styles.productsList} role="list">
          {productLinks.map(({ label, marker }) => (
            <li key={label}>
              <a className={styles.productLink} role="link" aria-disabled="true" tabIndex={-1}>
                {label}{marker}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
