# Secure Vercel deploy — A2A-x402 Oracle

Repo: https://github.com/kwizzlesurp10-ctrl/a2a-x402-oracle

## Required environment variables (Vercel)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production origin, no trailing slash (e.g. `https://a2a-x402-oracle.vercel.app`) |
| `X402_PAY_TO` | **Yes (paid routes)** | Base mainnet payee, e.g. `0x0d25A44f74868eCE53B305C97139CF4B62963410`. **No default fallback** — if unset, paid routes return **503**. Never use retired `0xAB745…4423D` or `0x05e1…` addresses. |
| `CDP_API_KEY_ID` | **Yes (paid routes)** | Coinbase Developer Platform API key ID for the x402 facilitator (`verify` / `settle`). Never log or commit. |
| `CDP_API_KEY_SECRET` | **Yes (paid routes)** | CDP API key secret (Sensitive on Vercel). Never log or commit. |
| `X402_FACILITATOR_URL` | Optional | Defaults to CDP production; when set, passed to `createCdpFacilitatorClient({ baseUrl })` so verify/settle JWTs target that host |
| `X402_NETWORK` | Optional | Defaults to `eip155:8453` (Base mainnet) |
| `MAX_PRICE_USD` | Optional | Defaults to `25` (cap 100) |
| `ADMIN_TOKEN` | Optional | Bearer bypass for operator testing only; mark Sensitive |
| `LLM_API_KEY` | Optional | Live counsel; stub responses without it |
| `LLM_BASE_URL` | Optional | Defaults to `https://api.x.ai/v1` |
| `ORACLE_MODEL` | Optional | Defaults to `grok-4` |
| `ORACLE_MODEL_PREVIEW` | Optional | Preview model override |

Removed: `X402_VERIFY_ENABLED` — verification and settlement always use the CDP facilitator via official `@x402/*` libraries.

## Deploy steps

1. Vercel → import this repo.
2. Set **all required** variables above (especially `X402_PAY_TO`, `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `NEXT_PUBLIC_SITE_URL`).
3. Deploy. Paid routes advertise USDC on Base with EIP-712 domain **name `USD Coin`, version `2`** and include Bazaar `extensions.bazaar` on HTTP 402 responses.
4. Probe unpaid: `POST /api/v1/consult` with `{"sku":"oracle_ask"}` must return **HTTP 402**, `PAYMENT-REQUIRED` header, and `extensions.bazaar` in the JSON body.
5. Probe paid (after a real wallet payment): same route with valid `PAYMENT-SIGNATURE` / `X-PAYMENT` → **200** with oracle JSON and `PAYMENT-RESPONSE` only after facilitator **settle** succeeds.

## Security notes

- Never set a treasury private key in Vercel env.
- Failed verify or settle must not return paid oracle content.
- Replay protection: duplicate payment signatures are rejected server-side.