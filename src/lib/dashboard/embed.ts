const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com"]);
const spotifyTypes = new Set(["track", "episode", "album", "playlist", "show"]);

export function embedSource(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (youtubeHosts.has(url.hostname)) {
    let id: string | null = null;
    if (url.hostname === "youtu.be" && parts.length === 1) id = parts[0];
    if (parts.length === 1 && parts[0] === "watch") id = url.searchParams.get("v");
    if (parts.length === 2 && ["embed", "shorts", "live"].includes(parts[0])) id = parts[1];
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;
    return { provider: "YouTube", src: `https://www.youtube-nocookie.com/embed/${id}`, href: `https://www.youtube.com/watch?v=${id}` };
  }
  if (url.hostname === "open.spotify.com") {
    if (/^intl-[a-z]{2}(?:-[a-z]{2})?$/i.test(parts[0] ?? "")) parts.shift();
    if (parts[0] === "embed") parts.shift();
    const [type, id] = parts;
    if (parts.length !== 2 || !spotifyTypes.has(type) || !/^[a-zA-Z0-9]{22}$/.test(id)) return null;
    return { provider: "Spotify", src: `https://open.spotify.com/embed/${type}/${id}`, href: `https://open.spotify.com/${type}/${id}` };
  }
  return null;
}
