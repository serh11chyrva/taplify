import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { accentText, appearanceFonts } from "@/lib/dashboard/appearance";
import { contentLink, type Block, type PageDraft } from "@/lib/dashboard/draft";
import { cn } from "@/lib/utils";
import type { ImageDetails } from "@/lib/dashboard/media";
import { PageEmbed } from "./page-embed";
import { ContactPreview } from "./contact-preview";
import { ContactForm, type PublishedForm } from "./contact-form";
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

function MediaFigure({ image, mediaBase }: { image: ImageDetails; mediaBase?: string }) {
  if (!mediaBase || !image.assetId) return null;
  return (
    <figure className="space-y-2">
      <Image unoptimized width={1000} height={720} src={`${mediaBase}/${image.assetId}`} alt={image.alt}
        className="h-auto w-full rounded-[var(--page-radius)] object-cover" />
      {image.caption && <figcaption className="text-sm opacity-75">{image.caption}</figcaption>}
    </figure>
  );
}

function PageBlock({ block, preview, mediaBase, form }: {
  block: Block; preview: boolean; mediaBase?: string; form?: PublishedForm;
}) {
  const linkStyle = "page-action flex items-center justify-center gap-2 rounded-[var(--page-radius)] border px-4 py-3 text-sm font-medium";
  switch (block.type) {
    case "contact":
      if (preview) return <ContactPreview form={block} />;
      return form ? <ContactForm initial={block} published={form} /> : <p id="contact" role="status" className="text-sm">The contact form is temporarily unavailable.</p>;
    case "image":
      return <MediaFigure image={block.image} mediaBase={mediaBase} />;
    case "gallery":
      if (!preview && !block.items.some((item) => item.assetId)) return null;
      return (
        <section className="space-y-3">
          {block.title && <h2 className="text-lg font-semibold">{block.title}</h2>}
          <div className="grid grid-cols-2 gap-3">{block.items.map((item) => <MediaFigure key={item.id} image={item} mediaBase={mediaBase} />)}</div>
        </section>
      );
    case "portfolio":
      if (!preview && !block.items.length) return null;
      return (
        <section className="space-y-3">
          {block.title && <h2 className="text-lg font-semibold">{block.title}</h2>}
          <div className="grid gap-3 min-[520px]:grid-cols-2">
            {block.items.map((item) => (
              <div key={item.id} className="space-y-2 rounded-[var(--page-radius)] border border-current/20 p-3">
                <MediaFigure mediaBase={mediaBase} image={item.image} />
                <h3 className="font-semibold">{item.title}</h3>
                {item.description && <p className="whitespace-pre-wrap text-sm opacity-80">{item.description}</p>}
                {item.url && <ContentLink href={item.url} preview={preview} itemId={item.id} className="text-sm font-medium underline">View project</ContentLink>}
              </div>
            ))}
          </div>
        </section>
      );
    case "markdown":
      if (!preview && !block.text.trim()) return null;
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
          {block.avatar && mediaBase ? <Image unoptimized width={72} height={72} src={`${mediaBase}/${block.avatar}`} alt=""
            className="mx-auto size-18 rounded-full object-cover" /> : <span aria-hidden="true" className="mx-auto grid size-18 place-items-center rounded-full border border-current/20 text-2xl font-semibold">
            {block.name.slice(0, 1).toUpperCase() || "•"}
          </span>}
          {block.name && <h2 className="text-3xl font-semibold tracking-tight">{block.name}</h2>}
          {block.bio && <p className="whitespace-pre-wrap opacity-80">{block.bio}</p>}
        </header>
      );
    case "hero":
      return (
        <header className="space-y-4 text-center">
          {block.image && <MediaFigure image={block.image} mediaBase={mediaBase} />}
          {block.heading && <h2 className="text-3xl font-semibold tracking-tight">{block.heading}</h2>}
          {block.description && <p className="whitespace-pre-wrap opacity-80">{block.description}</p>}
          {block.actionLabel && block.actionUrl && <ContentLink href={block.actionUrl} preview={preview} itemId={block.id}
            className={cn(linkStyle, "page-action-accent")}>{block.actionLabel}</ContentLink>}
        </header>
      );
    case "links":
      if (!preview && !block.items.some((item) => item.label && item.url)) return null;
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
      if (!preview && !block.items.some((item) => item.url)) return null;
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

export function PageRenderer({ draft, preview = false, mediaBase, form }: {
  draft: PageDraft; preview?: boolean; mediaBase?: string; form?: PublishedForm;
}) {
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
        {draft.blocks.map((block) => <PageBlock key={block.id} block={block} preview={preview} mediaBase={mediaBase} form={form} />)}
      </div>
    </article>
  );
}
