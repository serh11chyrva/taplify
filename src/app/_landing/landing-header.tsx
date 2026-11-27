"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import styles from "../landing.module.css";

export function LandingHeader({ brand, navigationLabel, children }: {
  brand: ReactNode;
  navigationLabel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    const update = () => header.toggleAttribute("data-scrolled", window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const narrowScreen = window.matchMedia("(width <= 40rem)");

    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !menu.current?.contains(event.target) && !menuTrigger.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function dismissOnWideScreen(event: MediaQueryListEvent) {
      if (!event.matches) setMenuOpen(false);
    }

    document.addEventListener("pointerdown", dismissOutside);
    narrowScreen.addEventListener("change", dismissOnWideScreen);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      narrowScreen.removeEventListener("change", dismissOnWideScreen);
    };
  }, [menuOpen]);

  return (
    <header ref={ref} className={styles.header}>
      <div
        className={`${styles.container} ${styles.headerInner}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !menuOpen) return;
          menuTrigger.current?.focus();
          setMenuOpen(false);
        }}
      >
        {brand}
        <Button
          ref={menuTrigger}
          type="button"
          variant="ghost"
          size="icon"
          className={styles.headerMenuToggle}
          aria-label={navigationLabel}
          aria-controls={menuId}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((expanded) => !expanded)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
        <div ref={menu} id={menuId} className={styles.headerMenu} data-open={menuOpen ? "" : undefined}>
          {children}
        </div>
      </div>
    </header>
  );
}
