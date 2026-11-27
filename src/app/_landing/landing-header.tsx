"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SiteMessages } from "@/lib/i18n/en";
import styles from "../landing.module.css";
import { ProductsMenu } from "./products-menu";
import { TaplifyIcon } from "./taplify-icon";

type HeaderCopy = Pick<SiteMessages["landing"], "mainNavigation" | "products" | "pricing" | "signIn" | "signUp">;

function HeaderBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" className={styles.brand} onNavigate={onNavigate}>
      <TaplifyIcon className={styles.brandIcon} />
      Taplify
    </Link>
  );
}

function HeaderMenu({ copy, onNavigate }: { copy: HeaderCopy; onNavigate?: () => void }) {
  return (
    <>
      <nav className={styles.headerNav} aria-label={copy.mainNavigation}>
        <ProductsMenu label={copy.products} />
        <button type="button" className={styles.headerLink} disabled>{copy.pricing}</button>
      </nav>
      <div className={styles.headerActions}>
        <Button asChild variant="ghost" className={styles.signIn}>
          <Link href="/login" onNavigate={onNavigate}>{copy.signIn}</Link>
        </Button>
        <Button asChild variant="outline" className={styles.signUp}>
          <Link href="/login" onNavigate={onNavigate}>{copy.signUp}</Link>
        </Button>
      </div>
    </>
  );
}

export function LandingHeader({ copy, closeLabel }: { copy: HeaderCopy; closeLabel: string }) {
  const ref = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const closeTrigger = useRef<HTMLButtonElement>(null);
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
    const narrowScreen = window.matchMedia("(width <= 40rem)");

    function dismissOnWideScreen(event: MediaQueryListEvent) {
      if (!event.matches) menu.current?.close();
    }

    narrowScreen.addEventListener("change", dismissOnWideScreen);
    return () => narrowScreen.removeEventListener("change", dismissOnWideScreen);
  }, []);

  function openMenu() {
    const dialog = menu.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    closeTrigger.current?.focus({ preventScroll: true });
    setMenuOpen(true);
  }

  function closeMenu() {
    menu.current?.close();
  }

  return (
    <header ref={ref} className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <HeaderBrand />
        <div className={styles.headerMenu}><HeaderMenu copy={copy} /></div>
        <Button
          ref={menuTrigger}
          type="button"
          variant="ghost"
          size="icon"
          className={styles.headerMenuToggle}
          aria-label={copy.mainNavigation}
          aria-controls={menuId}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          onClick={openMenu}
        >
          <Menu aria-hidden="true" />
        </Button>
      </div>
      <dialog
        ref={menu}
        id={menuId}
        className={styles.headerDialog}
        aria-label={copy.mainNavigation}
        onClose={() => {
          setMenuOpen(false);
          menuTrigger.current?.focus({ preventScroll: true });
        }}
      >
        <div className={`${styles.container} ${styles.headerInner}`}>
          <HeaderBrand onNavigate={closeMenu} />
          <Button
            ref={closeTrigger}
            type="button"
            variant="ghost"
            size="icon"
            className={styles.headerMenuToggle}
            aria-label={closeLabel}
            onClick={closeMenu}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className={styles.headerDialogBody}>
          <div className={`${styles.container} ${styles.headerDialogContent}`}>
            {menuOpen && <HeaderMenu copy={copy} onNavigate={closeMenu} />}
          </div>
        </div>
      </dialog>
    </header>
  );
}
