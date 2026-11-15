import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { skuById } from "./catalog";
import {
  DEFAULT_X402_PAY_TO,
  RETIRED_X402_PAY_TO,
  USDC_BASE,
  network,
  payTo,
  payToConfigured,
} from "./config";
import { createMockFacilitator } from "./test-facilitator";
import { __setTestFacilitatorForTests, resetX402ResourceServerForTests } from "./x402-seller";
import { paymentRequiredBody, wellKnownX402 } from "./x402";

describe("x402 payTo and challenge payload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    __setTestFacilitatorForTests(undefined);
    void resetX402ResourceServerForTests();
  });

  beforeEach(() => {
    vi.stubEnv("X402_PAY_TO", DEFAULT_X402_PAY_TO);
    vi.stubEnv("CDP_API_KEY_ID", "test-key-id");
    vi.stubEnv("CDP_API_KEY_SECRET", "test-key-secret");
    __setTestFacilitatorForTests(createMockFacilitator());
  });

  it("requires X402_PAY_TO to be set explicitly", () => {
    vi.stubEnv("X402_PAY_TO", undefined);
    expect(payToConfigured()).toBe(false);
    expect(() => payTo()).toThrow(/required/i);
  });

  it("rejects the retired payTo address (any casing)", () => {
    vi.stubEnv("X402_PAY_TO", RETIRED_X402_PAY_TO);
    expect(() => payTo()).toThrow(/retired address/i);
    vi.stubEnv("X402_PAY_TO", RETIRED_X402_PAY_TO.toLowerCase());
    expect(() => payTo()).toThrow(/retired address/i);
  });

  it("advertises Keith payTo, Base network, USDC asset, and EIP-712 domain on paid SKUs", async () => {
    const sku = skuById("oracle_ask");
    expect(sku).toBeDefined();
    const body = await paymentRequiredBody(sku!);
    const accept = body.accepts[0];

    expect(accept.payTo).toBe(payTo());
    expect(accept.payTo).toBe(DEFAULT_X402_PAY_TO);
    expect(accept.network).toBe("eip155:8453");
    expect(network()).toBe("eip155:8453");
    expect(accept.asset).toBe(USDC_BASE);
    expect(accept.extra?.name).toBe("USD Coin");
    expect(accept.extra?.version).toBe("2");
    expect(body.extensions?.bazaar).toBeDefined();
  });

  it("well-known x402 manifest uses the same payTo when configured", () => {
    const manifest = wellKnownX402();
    expect(manifest.payTo).toBe(DEFAULT_X402_PAY_TO);
    expect(manifest.asset).toBe(USDC_BASE);
    expect(manifest.network).toBe("eip155:8453");
  });
});