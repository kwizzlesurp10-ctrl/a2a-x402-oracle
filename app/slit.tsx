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
      setOut(res.ok ? `${String(data.verdict || "").toUpperCase()} · ${data.wisdom}` : data.error || "Preview refused.");
    } catch { setOut("Network error."); }
    finally { setBusy(false); }
  }
  return (<div className="slit"><div className="slit-head">ORACLE SLIT · PREVIEW</div><div className="slit-body"><textarea value={q} onChange={(e) => setQ(e.target.value)} maxLength={280} /><button className="btn solid" type="button" onClick={ask} disabled={busy}>{busy ? "Knocking" : "Ask the slit"}</button><div className="receipt">{out}</div></div></div>);
}
