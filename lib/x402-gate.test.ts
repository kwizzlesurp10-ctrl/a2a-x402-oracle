import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import type { PaymentPayload } from "@x402/core/types";
import { DEFAULT_X402_PAY_TO } from "./config";
import { skuById } from "./catalog";
import { createMockFacilitator } from "./test-facilitator";
import { __setTestFacilitatorForTests, resetX402ResourceServerForTests } from "./x402-seller";
import { finalizePaidRequest, gateRequest, paymentRequiredBody } from "./x402";

function requestWithPayment(headerValue?: string): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (headerValue) headers.set("PAYMENT-SIGNATURE", headerValue);
  return new NextRequest("https://example.com/api/v1/consult", {
    method: "POST",
    headers,
    body: JSON.stringify({ sku: "oracle_ask" }),
  });
}

async function buildSignedPaymentHeader(signature = "0xfake"): Promise<string> {
  const sku = skuById("oracle_ask")!;
  const required = await paymentRequiredBody(sku);
  const accept = required.accepts[0];
  const payload: PaymentPayload = {
    x402Version: 2,
    accepted: accept,
    payload: { signature, payload: { signature } },
  };
  return encodePaymentSignatureHeader(payload);
}

describe("x402 gate verify and settle", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __setTestFacilitatorForTests(undefined);
    void resetX402ResourceServerForTests();
  });

  beforeEach(() => {
    vi.stubEnv("X402_PAY_TO", DEFAULT_X402_PAY_TO);
    vi.stubEnv("CDP_API_KEY_ID", "test-key-id");
    vi.stubEnv("CDP_API_KEY_SECRET", "test-key-secret");
    __setTestFacilitatorForTests(createMockFacilitator());
  });

  it("returns 402 with bazaar data when unpaid", async () => {
    const gate = await gateRequest(requestWithPayment(), "oracle_ask");
    expect(gate.ok).toBe(false);
    if (gate.ok || gate.status !== 402) throw new Error("expected unpaid 402");
    expect(gate.body.extensions?.bazaar).toBeDefined();
    expect(gate.body.accepts[0].extra?.name).toBe("USD Coin");
    expect(gate.body.accepts[0].extra?.version).toBe("2");
  });

  it("returns 402 without paid access when verify rejects a fake payment header", async () => {
    __setTestFacilitatorForTests(createMockFacilitator({ verifyValid: false }));
    void resetX402ResourceServerForTests();
    const header = await buildSignedPaymentHeader("0xinvalid");
    const gate = await gateRequest(requestWithPayment(header), "oracle_ask");
    expect(gate.ok).toBe(false);
    if (gate.ok) throw new Error("expected verify failure");
    expect(gate.status).toBe(402);
  });

  it("verifies and settles successfully with mocked facilitator", async () => {
    const header = await buildSignedPaymentHeader("0xvalid-once");
    const gate = await gateRequest(requestWithPayment(header), "oracle_ask");
    expect(gate.ok).toBe(true);
    if (!gate.ok || gate.mode !== "paid") throw new Error("expected paid gate");
    const finalized = await finalizePaidRequest(gate.verify);
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) throw new Error("expected settlement");
    expect(finalized.settleResponse.success).toBe(true);
    expect(finalized.paymentResponseHeader.length).toBeGreaterThan(10);
  });

  it("returns settle failure without treating payment as complete", async () => {
    __setTestFacilitatorForTests(createMockFacilitator({ settleSuccess: false }));
    void resetX402ResourceServerForTests();
    const header = await buildSignedPaymentHeader("0xvalid-settle-fail");
    const gate = await gateRequest(requestWithPayment(header), "oracle_ask");
    expect(gate.ok).toBe(true);
    if (!gate.ok || gate.mode !== "paid") throw new Error("expected verify pass");
    const finalized = await finalizePaidRequest(gate.verify);
    expect(finalized.ok).toBe(false);
  });

  it("fails closed when payTo is missing", async () => {
    vi.stubEnv("X402_PAY_TO", undefined);
    const gate = await gateRequest(requestWithPayment(), "oracle_ask");
    expect(gate.ok).toBe(false);
    if (gate.ok) throw new Error("expected config failure");
    expect(gate.status).toBe(503);
  });
});