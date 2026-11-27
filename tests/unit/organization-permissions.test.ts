import { expect, test } from "vitest";
import { organizationCan } from "@/lib/dashboard/organizations";

test("allows editors to author and operators to handle inquiries and reports", () => {
  expect(organizationCan("editor", "draft:write")).toBe(true);
  expect(organizationCan("editor", "page:publish")).toBe(false);
  expect(organizationCan("editor", "leads:manage")).toBe(false);
  expect(organizationCan("operator", "leads:manage")).toBe(true);
  expect(organizationCan("operator", "analytics:read")).toBe(true);
  expect(organizationCan("operator", "draft:write")).toBe(false);
  expect(organizationCan("operator", "leads:delete")).toBe(false);
  expect(organizationCan("operator", "leads:export")).toBe(false);
  expect(organizationCan("owner", "workspace:manage")).toBe(true);
});
