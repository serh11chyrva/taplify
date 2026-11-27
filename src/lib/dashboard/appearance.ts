import { z } from "zod";

const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Enter a six-digit hex color.");
export const appearanceSchema = z.object({
  background: color, foreground: color, accent: color,
  font: z.enum(["geist", "serif", "mono"]),
  button: z.enum(["solid", "outline", "soft"]),
  radius: z.number().int().min(0).max(32),
});

export type PageAppearance = z.infer<typeof appearanceSchema>;

export const appearances = {
  Paper: { background: "#faf8f4", foreground: "#27221b", accent: "#766253", font: "geist", button: "outline", radius: 14 },
  Graphite: { background: "#171819", foreground: "#f4f4f0", accent: "#e1e9a8", font: "geist", button: "solid", radius: 12 },
  Ocean: { background: "#e9f4fd", foreground: "#11293c", accent: "#175c83", font: "geist", button: "soft", radius: 18 },
} satisfies Record<string, PageAppearance>;

export function accentText(hex: string) {
  const rgb = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((part) => {
    const value = Number.parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return luminance > 0.179 ? "#171819" : "#ffffff";
}

export const appearanceFonts = {
  geist: "var(--font-geist), system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
};
