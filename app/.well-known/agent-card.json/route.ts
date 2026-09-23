import { NextResponse } from "next/server";
import { agentCard } from "@/lib/x402";
export function GET() {
  return NextResponse.json(agentCard(), { headers: { "Content-Type": "application/a2a+json; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
