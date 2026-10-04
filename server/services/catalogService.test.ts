import { describe, expect, it } from "vitest";
import { searchEstimateCatalog } from "./catalogService";

describe("estimate catalog", () => {
  it("filters by search query", () => {
    const result = searchEstimateCatalog({ base: "ФЕР", query: "ламинат" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.name.toLocaleLowerCase().includes("ламинат"))).toBe(true);
  });

  it("keeps the selected normative base in every result", () => {
    const result = searchEstimateCatalog({ base: "ГЭСН", query: "розетка" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.base === "ГЭСН")).toBe(true);
  });

  it("returns a bounded result set", () => {
    const result = searchEstimateCatalog({ base: "ТЕР", limit: 2 });
    expect(result).toHaveLength(2);
  });
});
