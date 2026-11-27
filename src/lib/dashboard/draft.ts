import { z } from "zod";
import { resourceId } from "./organizations";
import { pageType } from "./pages";

export const pageName = z.string().trim().min(1, "Enter a page name.").max(45);
const bio = z.string().max(250);
const heading = z.string().max(120);
const description = z.string().max(2000);
const itemLabel = z.string().max(100);

export function contentLink(value: string, protocols = ["https:", "http:", "mailto:"]) {
  if (value === "#contact") return value;
  if (!value || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return protocols.includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

const linkUrl = z.string().trim().max(2048).refine((url) => !url || contentLink(url) !== null, "Enter a valid link.");
const website = z.string().trim().max(2048).refine((url) => !url || (url !== "#contact" && contentLink(url, ["https:", "http:"]) !== null),
  "Enter an HTTP or HTTPS address.");
const profileBlock = z.object({ id: resourceId, type: z.literal("profile"), name: heading, bio });
const heroBlock = z.object({ id: resourceId, type: z.literal("hero"), heading, description, actionLabel: itemLabel, actionUrl: linkUrl });
const linksBlock = z.object({
  id: resourceId, type: z.literal("links"), title: heading, layout: z.enum(["list", "grid"]),
  items: z.array(z.object({ id: resourceId, label: itemLabel, url: linkUrl })).max(25),
});

export const socialNetworks = ["Instagram", "YouTube", "LinkedIn", "GitHub", "X", "Facebook", "TikTok", "Dribbble", "Behance"] as const;
const socialBlock = z.object({
  id: resourceId, type: z.literal("social"), title: heading,
  items: z.array(z.object({ id: resourceId, network: z.enum(socialNetworks), url: website })).max(15),
});

const block = z.discriminatedUnion("type", [profileBlock, heroBlock, linksBlock, socialBlock]);

export const draftSchema = z.object({
  name: pageName,
  blocks: z.array(block).max(30).refine((blocks) => new Set(blocks.map((item) => item.id)).size === blocks.length,
    "Each block must have its own ID."),
});

export const createPageInput = z.object({
  name: pageName, type: pageType, bio: bio.optional().default(""), requestId: resourceId,
});
export const draftInput = z.object({ expectedRevision: z.number().int().positive(), draft: draftSchema });

export type PageDraft = z.infer<typeof draftSchema>;
export type Block = z.infer<typeof block>;

export const blockNames: Record<Block["type"], string> = {
  profile: "Profile", hero: "Hero", links: "Links", social: "Social links",
};

export function createBlock(type: Block["type"]): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "profile": return { id, type, name: "", bio: "" };
    case "hero": return { id, type, heading: "", description: "", actionLabel: "", actionUrl: "" };
    case "links": return { id, type, title: "Links", layout: "list", items: [] };
    case "social": return { id, type, title: "Find me online", items: [] };
  }
}

export function initialDraft(name: string, type: z.infer<typeof pageType>, intro: string): PageDraft {
  const lead: Block = type === "Personal"
    ? { id: crypto.randomUUID(), type: "profile", name, bio: intro }
    : { id: crypto.randomUUID(), type: "hero", heading: name, description: intro, actionLabel: "", actionUrl: "" };
  const links = createBlock("links");
  return { name, blocks: [lead, links] };
}

export function moveItem<T>(items: T[], index: number, next: number) {
  if (index === next || index < 0 || next < 0 || index >= items.length || next >= items.length) return items;
  const result = [...items];
  const [item] = result.splice(index, 1);
  result.splice(next, 0, item);
  return result;
}
