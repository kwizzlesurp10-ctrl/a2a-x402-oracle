"use client";
import { useState } from "react";
export function Slit() {
  const [q, setQ] = useState("Which A2A x402 calls are actually collecting money this week?");
  const [out, setOut] = useState("Awaiting a question. Preview is free and capped.");
  const [busy, setBusy] = useState(false);
  async function ask() {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q }) });
      const data = await res.json();
      setOut(res.ok ? `${data.verdict?.toUpperCase()} · ${data.wisdom}\n\n${data.implementation_prompt}` : data.error || "Preview refused.");
    } catch { setOut("Network error. Discovery still at /llms.txt."); }
    finally { setBusy(false); }
  }
  return (
    <div className="slit" aria-label="Oracle slit">
      <div className="slit-head">ORACLE SLIT · PREVIEW · NOT A RANKING</div>
      <div className="slit-body">
        <textarea value={q} onChange={(e) => setQ(e.target.value)} maxLength={280} aria-label="Preview question" />
        <button className="btn solid" type="button" onClick={ask} disabled={busy}>{busy ? "Knocking…" : "Ask the slit"}</button>
        <div className="receipt">{out}</div>
      </div>
      <div className="slit-foot">HTTP 402 is health. Declaration is marketing.</div>
    </div>
  );
}
