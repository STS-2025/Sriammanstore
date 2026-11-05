import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  app: { name: "production-app" },
  calls: [] as string[],
  getFunctions: vi.fn(() => ({ name: "functions" })),
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    mocks.calls.push(`callable:${name}`);
    return async (payload: unknown) => {
      mocks.calls.push("invoke");
      return { data: { eligible: true, payload } };
    };
  }),
}));

vi.mock("../services/authAdapter", () => ({
  authManager: {
    getProductionAdapter: () => ({ getAuthInstance: () => ({ app: mocks.app }) }),
  },
}));

vi.mock("firebase/functions", () => ({
  getFunctions: mocks.getFunctions,
  httpsCallable: mocks.httpsCallable,
}));

describe("Phone eligibility callable integration", () => {
  it("calls the eligibility endpoint and returns only its boolean eligibility result", async () => {
    mocks.calls.length = 0;
    const { checkCustomerPhoneEligibility } = await import("../services/phoneEligibilityService");
    await expect(checkCustomerPhoneEligibility("+919876543210")).resolves.toBe(true);
    expect(mocks.getFunctions).toHaveBeenCalledWith(mocks.app);
    expect(mocks.calls).toEqual(["callable:checkCustomerPhoneEligibility", "invoke"]);
  });

  it("uses the trusted phone synchronization callable for account updates", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/services/customerIdentityService.ts"),
      "utf8",
    );
    const callablePosition = source.indexOf('"updateCustomerVerifiedPhone"');
    expect(callablePosition).toBeGreaterThanOrEqual(0);
    expect(source).toContain(
      "getFunctions(authManager.getProductionAdapter().getAuthInstance().app)",
    );
    expect(source).not.toContain("customerPhoneIndex");
  });
});
