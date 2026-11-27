import type { Metadata } from "next";
import { requireDashboardSession } from "@/server/dashboard/session";
import "./dashboard.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireDashboardSession();

  return <div lang="en">{children}</div>;
}
