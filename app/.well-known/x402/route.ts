import { NextResponse } from "next/server";
import { wellKnownX402 } from "@/lib/x402";
export function GET() {
  return NextResponse.json(wellKnownX402(), { headers: { "Cache-Control": "public, max-age=300" } });
}
