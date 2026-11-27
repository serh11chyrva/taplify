export class DashboardRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function dashboardRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as {
      error?: { code: string; message: string; fields?: Record<string, string> };
    } | null;
    throw new DashboardRequestError(response.status, payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? "The request failed. Please try again.", payload?.error?.fields);
  }
  return response.json() as Promise<T>;
}

export function jsonRequest(method: "POST" | "PUT" | "PATCH" | "DELETE", body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export function requestMessage(error: unknown) {
  return error instanceof DashboardRequestError ? error.message : "Unable to connect. Please try again.";
}
