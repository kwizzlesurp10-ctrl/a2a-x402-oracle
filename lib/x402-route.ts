import { NextResponse } from "next/server";
import type { OracleEnvelope } from "./oracle-brain";
import {
  applyPaymentResponseHeader,
  GateResult,
  FinalizeResult,
  sellerMisconfiguredResponse,
  settleFailedResponse,
  unpaidResponse,
} from "./x402";

export function responseForGate(gate: GateResult): NextResponse | null {
  if (gate.ok) return null;
  if (gate.status === 503) return sellerMisconfiguredResponse(gate.sku, gate.message);
  return unpaidResponse(gate.sku, gate.body);
}

export function jsonWithOptionalPayment(
  payload: OracleEnvelope,
  finalize: FinalizeResult | null,
): NextResponse {
  if (finalize && !finalize.ok) {
    return settleFailedResponse(finalize.sku, finalize.body);
  }
  const response = NextResponse.json(payload);
  if (finalize?.ok) applyPaymentResponseHeader(response, finalize.paymentResponseHeader);
  return response;
}