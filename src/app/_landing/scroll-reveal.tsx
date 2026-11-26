"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "../landing.module.css";

export function ScrollReveal({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const { top, bottom } = element.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.reveal = "shown";
      observer.disconnect();
    }, { rootMargin: "0px 0px -24px" });
    element.dataset.reveal = "pending";
    observer.observe(element);

    return () => {
      observer.disconnect();
      delete element.dataset.reveal;
    };
  }, []);

  return <div ref={ref} className={className ? `${styles.reveal} ${className}` : styles.reveal}>{children}</div>;
}
