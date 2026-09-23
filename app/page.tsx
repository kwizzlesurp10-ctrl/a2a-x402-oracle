import { SKUS } from "@/lib/catalog";
import { siteUrl } from "@/lib/config";
import { Slit } from "./slit";
export default function Page() {
  const url = siteUrl();
  return (
    <main>
      <div className="wrap">
        <header className="topbar"><div className="mark">A2A-x402 <em>Oracle</em></div><nav><a href="#menu">Menu</a> · <a href={`${url}/.well-known/x402`}>/.well-known/x402</a></nav></header>
        <section className="hero" style={{ borderTop: 0 }}>
          <div>
            <div className="kicker">Oracle-402 · production demand rail</div>
            <h1>402 is the answer.<span>The Oracle is how you ask.</span></h1>
            <p className="lede">Paid demand intelligence for Agent-to-Agent commerce that settles on x402. Humans subscribe. Agents pay USDC on Base.</p>
            <p><a className="btn solid" href="#menu">See the menu</a></p>
          </div>
          <Slit />
        </section>
        <section id="menu">
          <h2>Menu of wisdom</h2>
          <table className="menu"><thead><tr><th>SKU</th><th>Unit</th><th>Price</th></tr></thead>
          <tbody>{SKUS.map((s) => (<tr key={s.id}><td><strong>{s.name}</strong><div>{s.id}</div></td><td>{s.unitOfWork}</td><td className={s.free ? "free" : "price"}>{s.free ? "free" : `$${s.priceUsd.toFixed(2)} USDC`}</td></tr>))}</tbody></table>
        </section>
        <section>
          <h2>How an agent connects</h2>
          <pre className="snippet">{`curl -i -X POST ${url}/api/v1/consult -H 'content-type: application/json' -d '{"sku":"oracle_ask","question":"What is a live 402?"}'`}</pre>
        </section>
        <footer className="footer"><div>A2A-x402 Oracle · burner payTo only</div><div><a href="/llms.txt">llms.txt</a></div></footer>
      </div>
    </main>
  );
}
