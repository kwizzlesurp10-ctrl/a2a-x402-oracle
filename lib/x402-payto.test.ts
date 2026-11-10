import { afterEach, describe, expect, it, vi } from "vitest";
import { skuById } from "./catalog";
import {
  DEFAULT_X402_PAY_TO,
  RETIRED_X402_PAY_TO,
  USDC_BASE,
  network,
  payTo,
} from "./config";
import { paymentRequiredBody, wellKnownX402 } from "./x402";

describe("x402 payTo and challenge payload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults payTo to Keith's Base Account", () => {
    vi.stubEnv("X402_PAY_TO", undefined);
    expect(payTo()).toBe(DEFAULT_X402_PAY_TO);
    expect(DEFAULT_X402_PAY_TO.toLowerCase()).toBe(
      "0x0d25a44f74868ece53b305c97139cf4b62963410",
    );
  });

  it("rejects the retired payTo address (any casing)", () => {
    vi.stubEnv("X402_PAY_TO", RETIRED_X402_PAY_TO);
    expect(() => payTo()).toThrow(/retired address/i);
    vi.stubEnv("X402_PAY_TO", RETIRED_X402_PAY_TO.toLowerCase());
    expect(() => payTo()).toThrow(/retired address/i);
  });

  it("advertises Keith payTo, Base network, and USDC asset on paid SKUs", () => {
    const sku = skuById("oracle_ask");
    expect(sku).toBeDefined();
    const body = paymentRequiredBody(sku!);
    const accept = body.accepts[0];

    expect(accept.payTo).toBe(payTo());
    expect(accept.payTo).toBe(DEFAULT_X402_PAY_TO);
    expect(accept.network).toBe("eip155:8453");
    expect(network()).toBe("eip155:8453");
    expect(accept.asset).toBe(USDC_BASE);
    expect(USDC_BASE.toLowerCase()).toBe(
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    );
  });

  it("well-known x402 manifest uses the same payTo", () => {
    const manifest = wellKnownX402();
    expect(manifest.payTo).toBe(DEFAULT_X402_PAY_TO);
    expect(manifest.asset).toBe(USDC_BASE);
    expect(manifest.network).toBe("eip155:8453");
  });
});
