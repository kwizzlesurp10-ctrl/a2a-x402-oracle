import type { FacilitatorClient } from "@x402/core/server";
import type { PaymentPayload, PaymentRequirements, SettleResponse, VerifyResponse } from "@x402/core/types";

export function createMockFacilitator(options?: {
  verifyValid?: boolean;
  settleSuccess?: boolean;
}): FacilitatorClient {
  const verifyValid = options?.verifyValid ?? true;
  const settleSuccess = options?.settleSuccess ?? true;

  return {
    async verify(_paymentPayload: PaymentPayload, _paymentRequirements: PaymentRequirements): Promise<VerifyResponse> {
      return verifyValid
        ? { isValid: true, payer: "0x1111111111111111111111111111111111111111" }
        : { isValid: false, invalidReason: "invalid_payload" };
    },
    async settle(_paymentPayload: PaymentPayload, _paymentRequirements: PaymentRequirements): Promise<SettleResponse> {
      return settleSuccess
        ? {
            success: true,
            transaction: "0xdeadbeef",
            network: "eip155:8453",
            payer: "0x1111111111111111111111111111111111111111",
          }
        : {
            success: false,
            errorReason: "settlement_failed",
            transaction: "",
            network: "eip155:8453",
          };
    },
    async getSupported() {
      return {
        kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:8453", extra: { name: "USD Coin", version: "2" } }],
        extensions: ["bazaar"],
        signers: {},
      };
    },
  };
}