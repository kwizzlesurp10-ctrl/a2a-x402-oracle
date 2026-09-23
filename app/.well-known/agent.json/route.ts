import { NextResponse } from "next/server";
import { agentCard } from "@/lib/x402";
export function GET() {
  return NextResponse.json(agentCard(), { headers: { "Cache-Control": "public, max-age=300" } });
}
