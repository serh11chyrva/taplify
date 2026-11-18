import "server-only";
import { getAuth } from "@/server/auth";
import { isAuthConfigured } from "@/server/env";

export async function getSession(requestHeaders: Headers) {
  if (!isAuthConfigured()) return null;
  const auth = await getAuth();
  return auth.api.getSession({ headers: requestHeaders });
}
