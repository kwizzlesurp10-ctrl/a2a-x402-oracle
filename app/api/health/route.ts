import { NextResponse } from "next/server";
import { SKUS } from "@/lib/catalog";
import { healthPayload } from "@/lib/oracle-brain";
import { corsPreflight } from "@/lib/x402";
export function OPTIONS() { return corsPreflight(); }
export function GET() {
  return NextResponse.json({ ...healthPayload(), menu: SKUS.map((s) => ({ id: s.id, priceUsd: s.priceUsd, free: s.free })) }, { headers: { "Cache-Control": "public, max-age=60" } });
}
