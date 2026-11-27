"use client";

import { useState } from "react";
import { embedSource } from "@/lib/dashboard/embed";

export function PageEmbed({ url, title, preview, itemId }: { url: string; title: string; preview: boolean; itemId: string }) {
  const source = embedSource(url);
  const [loadedUrl, setLoadedUrl] = useState<string>();
  if (!source) return preview ? <p className="text-sm opacity-70">Add a YouTube or Spotify link.</p> : null;
  const label = title || source.provider;
  return (
    <section className="space-y-3 rounded-[var(--page-radius)] border border-current/20 p-4">
      <h2 className="font-semibold">{label}</h2>
      {loadedUrl === source.src && !preview
        ? <iframe className={source.provider === "YouTube" ? "aspect-video w-full rounded-md" : "h-40 w-full rounded-md"}
            title={label} src={source.src} allow="encrypted-media; fullscreen; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        : <button type="button" className="page-action" disabled={preview} onClick={() => setLoadedUrl(source.src)}>
            Load {source.provider} player
          </button>}
      {!preview && <a href={source.href} data-page-link={itemId} className="text-sm underline" rel="nofollow noreferrer">Open on {source.provider}</a>}
    </section>
  );
}
