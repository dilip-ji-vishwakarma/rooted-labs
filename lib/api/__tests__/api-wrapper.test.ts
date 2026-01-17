// @jest-environment node
process.env.NEXT_PUBLIC_CLIENT_NAME = process.env.NEXT_PUBLIC_CLIENT_NAME || "";

import { fetchEntityData } from "../api";

describe("fetchEntityData in mock mode", () => {
  it("uses mock for options", async () => {
    const res = await fetchEntityData("customer", "options", undefined, true);
    expect(Array.isArray(res)).toBe(true);
  });

  it("uses mock for get", async () => {
    const res = await fetchEntityData("customer", "get", undefined, true);
    expect(Array.isArray(res)).toBe(true);
  });
});
