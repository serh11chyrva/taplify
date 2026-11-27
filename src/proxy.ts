import { NextResponse, type NextRequest } from "next/server";
import { dashboardDestination, dashboardDestinationHeader } from "@/lib/dashboard-destination";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const { pathname, search } = request.nextUrl;
  headers.set(dashboardDestinationHeader, dashboardDestination(`${pathname}${search}`));
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

export const config = { matcher: "/dashboard/:path*" };
