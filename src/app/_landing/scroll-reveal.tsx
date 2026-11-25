"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ScrollReveal({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.reveal = "shown";
      observer.disconnect();
    });
    element.dataset.reveal = "pending";
    observer.observe(element);

    return () => {
      observer.disconnect();
      delete element.dataset.reveal;
    };
  }, []);

  return <div ref={ref} className={className}>{children}</div>;
}
