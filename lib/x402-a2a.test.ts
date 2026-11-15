import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import type { PaymentPayload } from "@x402/core/types";
import { POST } from "@/app/a2a/route";
import { DEFAULT_X402_PAY_TO } from "./config";
import { skuById } from "./catalog";
import { clearPaymentReplayGuardsForTests } from "./cache";
import { createMockFacilitator } from "./test-facilitator";
import { __setTestFacilitatorForTests, resetX402ResourceServerForTests } from "./x402-seller";
import { paymentRequiredBody } from "./x402";

async function buildA2aPaymentHeader(signature: string): Promise<string> {
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

describe("POST /a2a payment response header", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __setTestFacilitatorForTests(undefined);
    void resetX402ResourceServerForTests();
    clearPaymentReplayGuardsForTests();
  });

  beforeEach(() => {
    vi.stubEnv("X402_PAY_TO", DEFAULT_X402_PAY_TO);
    vi.stubEnv("CDP_API_KEY_ID", "test-key-id");
    vi.stubEnv("CDP_API_KEY_SECRET", "test-key-secret");
    __setTestFacilitatorForTests(createMockFacilitator());
  });

  it("sets PAYMENT-RESPONSE after successful verify and settle", async () => {
    const header = await buildA2aPaymentHeader("0xa2a-settle-ok");
    const req = new NextRequest("https://example.com/a2a", {
      method: "POST",
      headers: { "content-type": "application/json", "PAYMENT-SIGNATURE": header },
      body: JSON.stringify({ skill: "oracle_ask", question: "test" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const paymentResponse = res.headers.get("PAYMENT-RESPONSE");
    expect(paymentResponse).toBeTruthy();
    expect(paymentResponse!.length).toBeGreaterThan(16);
  });
});