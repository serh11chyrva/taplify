"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "../landing.module.css";

export function ScrollReveal({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const { top, bottom, height } = element.getBoundingClientRect();
    const viewportHeight = document.documentElement.clientHeight;
    if (!height || !viewportHeight) return;

    // Keep the required visible area reachable for unusually tall blocks.
    const threshold = Math.min(0.2, (viewportHeight * 0.95) / height);
    const visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
    if (visibleHeight >= height * threshold) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < threshold) return;
      element.dataset.reveal = "shown";
      observer.disconnect();
    }, { threshold });
    element.dataset.reveal = "pending";
    observer.observe(element);

    return () => {
      observer.disconnect();
      delete element.dataset.reveal;
    };
  }, []);

  return <div ref={ref} className={className ? `${styles.reveal} ${className}` : styles.reveal}>{children}</div>;
}
