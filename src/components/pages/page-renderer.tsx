import type { ReactNode } from "react";
import { contentLink, type Block, type PageDraft } from "@/lib/dashboard/draft";
import { cn } from "@/lib/utils";

export function ContentLink({ href, children, preview, className, itemId }: {
  href: string;
  children: ReactNode;
  preview: boolean;
  className?: string;
  itemId?: string;
}) {
  const url = contentLink(href);
  return preview || !url ? <span className={className}>{children}</span> : (
    <a href={url} className={className} data-page-link={itemId} rel={url.startsWith("#") ? undefined : "nofollow noreferrer"}>{children}</a>
  );
}

function PageBlock({ block, preview }: { block: Block; preview: boolean }) {
  const linkStyle = "flex w-full items-center justify-center gap-2 rounded-[var(--page-radius)] border border-current/20 px-4 py-3 text-sm font-medium";
  switch (block.type) {
    case "profile":
      return (
        <header className="space-y-3 text-center">
          <span aria-hidden="true" className="mx-auto grid size-18 place-items-center rounded-full border border-current/20 text-2xl font-semibold">
            {block.name.slice(0, 1).toUpperCase() || "•"}
          </span>
          {block.name && <h2 className="text-3xl font-semibold tracking-tight">{block.name}</h2>}
          {block.bio && <p className="whitespace-pre-wrap opacity-80">{block.bio}</p>}
        </header>
      );
    case "hero":
      return (
        <header className="space-y-4 text-center">
          {block.heading && <h2 className="text-3xl font-semibold tracking-tight">{block.heading}</h2>}
          {block.description && <p className="whitespace-pre-wrap opacity-80">{block.description}</p>}
          {block.actionLabel && block.actionUrl && <ContentLink href={block.actionUrl} preview={preview} itemId={block.id}
            className={cn(linkStyle, "bg-[var(--page-accent)] text-[var(--page-accent-text)]")}>{block.actionLabel}</ContentLink>}
        </header>
      );
    case "links":
      return (
        <section className="space-y-3">
          {block.title && <h2 className="text-lg font-semibold">{block.title}</h2>}
          <ul className={cn("grid gap-2", block.layout === "grid" && "grid-cols-2")}>
            {block.items.filter((item) => item.label && item.url).map((item) => (
              <li key={item.id}><ContentLink itemId={item.id} href={item.url} preview={preview} className={linkStyle}>{item.label}</ContentLink></li>
            ))}
          </ul>
          {preview && block.items.length === 0 && <p className="text-sm opacity-70">Add a link to see it here.</p>}
        </section>
      );
    case "social":
      return (
        <section className="space-y-3">
          {block.title && <h2 className="text-lg font-semibold">{block.title}</h2>}
          <ul className="flex flex-wrap gap-2">
            {block.items.filter((item) => item.url).map((item) => (
              <li key={item.id}><ContentLink itemId={item.id} href={item.url} preview={preview} className={linkStyle}>{item.network}</ContentLink></li>
            ))}
          </ul>
        </section>
      );
  }
}

export function PageRenderer({ draft, preview = false }: { draft: PageDraft; preview?: boolean }) {
  return (
    <article className="page-renderer min-h-96 overflow-hidden rounded-xl bg-white px-5 py-8 text-slate-950" aria-label={draft.name}>
      <div className="mx-auto grid max-w-lg gap-7 overflow-wrap-anywhere">
        {draft.blocks.map((block) => <PageBlock key={block.id} block={block} preview={preview} />)}
      </div>
    </article>
  );
}
