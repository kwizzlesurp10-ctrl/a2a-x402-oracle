import { NextRequest, NextResponse } from "next/server";
import { previewAnswer } from "@/lib/oracle-brain";
import { corsPreflight } from "@/lib/x402";
const buckets = new Map<string, { n: number; t: number }>();
export function OPTIONS() { return corsPreflight(); }
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const now = Date.now();
  const row = buckets.get(ip);
  if (!row || now - row.t > 86_400_000) buckets.set(ip, { n: 1, t: now });
  else if (row.n >= 5) return NextResponse.json({ error: "Preview quota exhausted. Pay oracle_ask." }, { status: 429 });
  else row.n += 1;
  let question = "";
  try { question = String((await req.json()).question || ""); } catch { question = ""; }
  return NextResponse.json(previewAnswer(question));
}
