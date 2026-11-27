import { expect, test } from "vitest";
import { authDestination, dashboardDestination } from "@/lib/dashboard-destination";

test("preserves dashboard filters and excludes the App Router transport parameter", () => {
  const next = dashboardDestination("/dashboard/org/pages/example/leads?status=new&search=Ada+Lovelace&_rsc=abc");
  expect(next).toBe("/dashboard/org/pages/example/leads?status=new&search=Ada+Lovelace");
  expect(new URL(authDestination("/sign-in", next), "https://taplify.invalid").searchParams.get("next")).toBe(next);
});

test.each([
  "//elsewhere.test/dashboard", "https://elsewhere.test/dashboard", "/dashboard/../sign-in",
  "/dashboard\\elsewhere", "/dashboard/%2e%2e", "/dashboard-other", "/dashboard?\r\nextra=true",
])("uses the dashboard default for an invalid destination %s", (next) => {
  expect(dashboardDestination(next)).toBe("/dashboard");
});
