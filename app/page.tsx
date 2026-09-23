import { SKUS } from "@/lib/catalog";
import { siteUrl } from "@/lib/config";
import { Slit } from "./slit";
export default function Page() {
  const url = siteUrl();
  return (<main><div className="wrap"><header className="topbar"><div className="mark">A2A-x402 <em>Oracle</em></div></header><section className="hero"><div><div className="kicker">Oracle-402</div><h1>402 is the answer.<span>The Oracle is how you ask.</span></h1><p className="lede">Paid demand intelligence for A2A commerce on x402. Agents pay USDC on Base.</p></div><Slit /></section><section id="menu"><h2>Menu</h2><table className="menu"><tbody>{SKUS.map((s) => (<tr key={s.id}><td>{s.name}</td><td className={s.free ? "free" : "price"}>{s.free ? "free" : `$${s.priceUsd.toFixed(2)}`}</td></tr>))}</tbody></table></section><pre className="snippet">{`curl -i -X POST ${url}/api/v1/consult -d '{"sku":"oracle_ask"}'`}</pre></div></main>);
}
