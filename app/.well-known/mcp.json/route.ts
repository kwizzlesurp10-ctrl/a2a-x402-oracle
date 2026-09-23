import { NextResponse } from "next/server";
import { mcpManifest } from "@/lib/x402";
export function GET() {
  return NextResponse.json(mcpManifest(), { headers: { "Cache-Control": "public, max-age=300" } });
}
