import "server-only";
import { z } from "zod";

export class DashboardError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404 | 409 | 422 | 429 | 503,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function missingResource() {
  return new DashboardError(404, "NOT_FOUND", "This resource is unavailable.");
}

export function validate<S extends z.ZodType>(schema: S, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (path && !Object.hasOwn(fields, path)) {
      Object.defineProperty(fields, path, { value: issue.message, enumerable: true });
    }
  }
  throw new DashboardError(422, "INVALID_INPUT", result.error.issues[0]?.message ?? "Check the submitted values.", fields);
}

export function isDuplicateKey(error: unknown) {
  return error instanceof Error && "code" in error && error.code === 11000;
}
