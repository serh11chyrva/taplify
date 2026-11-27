"use client";

import type { PointerEvent, ReactNode } from "react";
import styles from "../landing.module.css";

function updateTouchPress(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "touch" || !event.isPrimary || !(event.target instanceof Element)) return;

  const link = event.target.closest("a[href]");
  link?.toggleAttribute("data-touch-pressed", event.type === "pointerdown");
}

export function FooterColumns({ children }: { children: ReactNode }) {
  return (
    <div
      className={styles.footerColumns}
      onPointerDown={updateTouchPress}
      onPointerUp={updateTouchPress}
      onPointerCancel={updateTouchPress}
      onLostPointerCapture={updateTouchPress}
    >
      {children}
    </div>
  );
}
