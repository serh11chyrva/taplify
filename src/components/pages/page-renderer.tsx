import type { CSSProperties, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { accentText, appearanceFonts } from "@/lib/dashboard/appearance";
import { contentLink, type Block, type PageDraft } from "@/lib/dashboard/draft";
import { cn } from "@/lib/utils";
import { PageEmbed } from "./page-embed";
import "./page-renderer.css";

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
  const linkStyle = "page-action flex items-center justify-center gap-2 rounded-[var(--page-radius)] border px-4 py-3 text-sm font-medium";
  switch (block.type) {
    case "markdown":
      return (
        <section className="page-prose">
          <ReactMarkdown skipHtml disallowedElements={["img"]} urlTransform={(url) => contentLink(url) ?? ""}
            components={{ a: ({ href, children }) => <ContentLink href={href ?? ""} preview={preview}>{children}</ContentLink> }}>
            {block.text}
          </ReactMarkdown>
        </section>
      );
    case "embed":
      return <PageEmbed url={block.url} title={block.title} itemId={block.id} preview={preview} />;
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
            className={cn(linkStyle, "page-action-accent")}>{block.actionLabel}</ContentLink>}
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
  const { appearance } = draft;
  const style = {
    "--page-background": appearance.background, "--page-text": appearance.foreground,
    "--page-accent": appearance.accent, "--page-accent-text": accentText(appearance.accent),
    "--page-radius": `${appearance.radius}px`, fontFamily: appearanceFonts[appearance.font],
  } as CSSProperties;
  return (
    <article className="page-renderer min-h-96 overflow-hidden rounded-xl px-5 py-8 sm:py-10" data-button={appearance.button} style={style}>
      {preview ? null : <h1 className="sr-only">{draft.name}</h1>}
      <div className="mx-auto grid max-w-lg gap-7">
        {draft.blocks.map((block) => <PageBlock key={block.id} block={block} preview={preview} />)}
      </div>
    </article>
  );
}
