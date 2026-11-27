import { expect, test } from "vitest";
import { csvCell } from "@/server/dashboard/lead-columns";
import { leadFilters, leadQueryString } from "@/lib/dashboard/leads";

test("quotes CSV data and treats formula-like text as text", () => {
  expect(csvCell('Hello, "world"')).toBe('"Hello, ""world"""');
  expect(csvCell(" =1+1")).toBe(`"' =1+1"`);
  expect(csvCell("\t@value")).toBe(`"'\t@value"`);
  expect(csvCell("Line one\nLine two")).toBe('"Line one\nLine two"');
});

test("preserves valid filters and ignores invalid calendar dates", () => {
  const filters = leadFilters({ status: "closed", read: "read", from: "2026-02-30", to: "2026-03-04", page: "3" });
  expect(leadQueryString(filters)).toBe("?status=closed&read=read&to=2026-03-04&page=3");
});
