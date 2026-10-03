import { describe, expect, it } from "vitest";

import { getDashboardSnapshot } from "@/services/dashboard";

describe("getDashboardSnapshot", () => {
  it("returns dummy dashboard data through the service layer", async () => {
    const result = await getDashboardSnapshot();

    expect(result.error).toBeNull();
    expect(result.data?.navigation.length).toBeGreaterThan(0);
    expect(result.data?.workQueue[0]?.id).toMatch(/^[A-Z]+-\d+/);
  });
});
