"use client";

import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import type { AnalyticsReport, TrafficCounts } from "@/lib/dashboard/analytics";

const series = [
  { key: "views", label: "Views", color: "#d0d5fa" },
  { key: "uniqueVisitors", label: "Unique visitors", color: "#9eabff" },
  { key: "clicks", label: "Link clicks", color: "#f1c579" },
  { key: "submissions", label: "Submissions", color: "#8ce2b3" },
] as const;
const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
const dayLabel = (value: string) => date.format(new Date(`${value}T00:00:00.000Z`));

export function AnalyticsChart({ days }: { days: AnalyticsReport["days"] }) {
  const prefix = useId().replace(/[:]/g, "");
  const [visible, setVisible] = useState<(keyof TrafficCounts)[]>(["views", "uniqueVisitors", "submissions"]);

  function toggle(key: keyof TrafficCounts) {
    setVisible((current) => {
      if (!current.includes(key)) return [...current, key];
      return current.length > 1 ? current.filter((entry) => entry !== key) : current;
    });
  }

  return (
    <section className="min-w-0 space-y-4 rounded-xl border bg-surface p-4 lg:p-5" aria-label="Daily traffic chart">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="font-semibold">Traffic over time</h2><p className="mt-1 text-xs text-muted-foreground">Daily totals in UTC</p></div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Chart metrics">
          {series.map(({ key, label, color }) => (
            <Button key={key} type="button" variant="ghost" size="sm" aria-pressed={visible.includes(key)}
              className="text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground" onClick={() => toggle(key)}>
              <span className="size-2 rounded-full" style={{ background: color }} aria-hidden="true" />{label}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-64 min-w-0 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={days} margin={{ top: 8, left: -22, bottom: 4, right: 12 }}>
            <defs>{series.map(({ key, color }) => (
              <linearGradient key={key} id={`${prefix}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} /><stop offset="100%" stopColor={color} stopOpacity={0.01} />
              </linearGradient>
            ))}</defs>
            <CartesianGrid stroke="#29292d" vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: "#aaaab5", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis allowDecimals={false} tick={{ fill: "#aaaab5", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip labelFormatter={(value) => dayLabel(String(value))}
              contentStyle={{ background: "#161618", borderColor: "#34343a", borderRadius: 8 }} labelStyle={{ color: "#f3f3f5" }} />
            {series.filter(({ key }) => visible.includes(key)).map(({ key, label, color }) => <Area key={key}
              name={label} dataKey={key} type="monotone" stroke={color} strokeWidth={2} fill={`url(#${prefix}-${key})`} isAnimationActive={false} />)}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
