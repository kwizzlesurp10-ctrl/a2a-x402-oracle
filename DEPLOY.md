# Secure Vercel deploy — A2A-x402 Oracle

Repo: https://github.com/kwizzlesurp10-ctrl/a2a-x402-oracle

1. Vercel import this repo (Kwizzle team).
2. Set NEXT_PUBLIC_SITE_URL to the production origin (no trailing slash).
3. Set X402_PAY_TO burner, X402_FACILITATOR_URL CDP mainnet, X402_NETWORK=eip155:8453, MAX_PRICE_USD=25, X402_VERIFY_ENABLED=false until /verify is wired.
4. ADMIN_TOKEN and LLM_API_KEY as Sensitive. Never a treasury private key.
5. Probe: unpaid POST /api/v1/consult must return HTTP 402 with accepts[].
6. First mainnet oracle_ask settlement before claiming Bazaar rank.
