"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "../landing.module.css";

export function LandingHeader({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    const update = () => header.toggleAttribute("data-scrolled", window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return <header ref={ref} className={styles.header}>{children}</header>;
}
