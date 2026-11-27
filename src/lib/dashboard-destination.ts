export const dashboardPath = "/dashboard";
export const dashboardDestinationHeader = "x-taplify-dashboard-destination";

export function dashboardDestination(value: string | string[] | null | undefined) {
  if (typeof value !== "string" || value.length > 2000 || /[\\#\u0000-\u0020\u007f]/.test(value)) return dashboardPath;
  const [pathname] = value.split("?");
  if (!/^\/dashboard(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(pathname)) return dashboardPath;
  const url = new URL(value, "https://taplify.invalid");
  url.searchParams.delete("_rsc");
  return `${url.pathname}${url.search}`;
}

export function authDestination(path: "/sign-in" | "/sign-up", next: string) {
  return next === dashboardPath ? path : `${path}?${new URLSearchParams({ next })}`;
}
