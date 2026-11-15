import { createCdpFacilitatorClient } from "@coinbase/cdp-sdk/x402";
import type { FacilitatorClient } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { x402ResourceServer } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { bazaarResourceServerExtension } from "@x402/extensions/bazaar";
import { network } from "./config";

let cachedServer: x402ResourceServer | null = null;
let initPromise: Promise<x402ResourceServer> | null = null;
let testFacilitator: FacilitatorClient | undefined;

export function __setTestFacilitatorForTests(client: FacilitatorClient | undefined): void {
  testFacilitator = client;
  cachedServer = null;
  initPromise = null;
}

export function hasCdpCredentials(): boolean {
  return Boolean(
    testFacilitator ||
      (process.env.CDP_API_KEY_ID?.trim() && process.env.CDP_API_KEY_SECRET?.trim()),
  );
}

function createFacilitator(): FacilitatorClient {
  if (testFacilitator) return testFacilitator;
  return createCdpFacilitatorClient({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
  });
}

export async function getX402ResourceServer(): Promise<x402ResourceServer> {
  if (cachedServer) return cachedServer;
  if (!initPromise) {
    initPromise = (async () => {
      const facilitator = createFacilitator();
      const server = new x402ResourceServer(facilitator);
      registerExactEvmScheme(server, { networks: [network() as Network] });
      server.registerExtension(bazaarResourceServerExtension);
      await server.initialize();
      cachedServer = server;
      return server;
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export async function resetX402ResourceServerForTests(): Promise<void> {
  cachedServer = null;
  initPromise = null;
}