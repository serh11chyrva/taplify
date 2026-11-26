import Link from "next/link";
import { COOKIE_POLICY_PATH } from "@/lib/cookie-consent";
import { cn } from "@/lib/utils";
import { ManageCookiesButton } from "./cookie-consent-provider";
import styles from "./cookie-consent.module.css";

export function CookieFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-sm", className)}>
      <Link className={styles.textAction} href={COOKIE_POLICY_PATH}>Cookie Policy</Link>
      <ManageCookiesButton className={styles.textAction} />
    </footer>
  );
}
