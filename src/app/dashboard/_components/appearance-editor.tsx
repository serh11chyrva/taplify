"use client";

import { Button } from "@/components/ui/button";
import { appearances, type PageAppearance } from "@/lib/dashboard/appearance";

export function AppearanceEditor({ appearance, onChange }: { appearance: PageAppearance; onChange: (value: PageAppearance) => void }) {
  return (
    <>
      <h2 className="font-semibold">Appearance</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(appearances).map(([label, value]) => (
          <Button key={label} type="button" size="sm" variant="outline" onClick={() => onChange(value)}>
            <span className="size-3 rounded-full border" style={{ background: value.background }} aria-hidden="true" />{label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(["background", "foreground", "accent"] as const).map((key) => (
          <label key={key} className="grid gap-2 text-sm capitalize">
            {key}<input type="color" value={appearance[key]} className="h-9 w-full rounded border bg-background p-1"
              onChange={(event) => onChange({ ...appearance, [key]: event.target.value })} />
          </label>
        ))}
      </div>
      <label className="grid gap-1.5 text-sm">Font
        <select className="dashboard-input" value={appearance.font}
          onChange={(event) => onChange({ ...appearance, font: event.target.value as PageAppearance["font"] })}>
          <option value="geist">Geist</option><option value="serif">Serif</option><option value="mono">Monospace</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">Button style
        <select className="dashboard-input" value={appearance.button}
          onChange={(event) => onChange({ ...appearance, button: event.target.value as PageAppearance["button"] })}>
          <option value="solid">Solid</option><option value="outline">Outline</option><option value="soft">Soft</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">Corner radius ({appearance.radius}px)
        <input type="range" min={0} max={32} value={appearance.radius} onChange={(event) => onChange({ ...appearance, radius: Number(event.target.value) })} />
      </label>
    </>
  );
}
