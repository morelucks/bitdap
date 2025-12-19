import txPkg from "@stacks/transactions";
import * as networkPkg from "@stacks/network";
import fetch from "cross-fetch";
import { config } from "dotenv";

config();

const {
  STACKS_MAINNET,
  STACKS_TESTNET,
  createNetwork: createNetworkFn,
  StacksMainnet,
  StacksTestnet,
} = networkPkg as any;

const {
  AnchorMode,
  ClarityVersion,
  makeContractCall,
  broadcastTransaction,
  noneCV,
  principalCV,
  uintCV,
} = txPkg as any;

const PRIVATE_KEY =
  process.env.PRIVATE_KEY || process.env.DEPLOYER_KEY || process.env.privateKey;
const STACKS_NETWORK = process.env.STACKS_NETWORK === "testnet" ? "testnet" : "mainnet";
const STACKS_API_URL =
  process.env.STACKS_API_URL ||
  (STACKS_NETWORK === "testnet" ? "https://api.testnet.hiro.so" : "https://api.hiro.so");
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB";
const CONTRACT_NAME = process.env.CONTRACT_NAME || "bitdap-token";
const RECIPIENT_ADDRESS =
  process.env.RECIPIENT_ADDRESS || "SP3F13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ";
const TX_COUNT = Number.parseInt(process.env.TX_COUNT || "100", 10);
const FEE = Number.parseInt(process.env.FEE || "300", 10);
const DELAY_MS = Number.parseInt(process.env.DELAY_MS || "500", 10);
const PAUSE_ON_RATE_LIMIT_MS = Number.parseInt(
  process.env.PAUSE_ON_RATE_LIMIT_MS || "30000",
  10,
);

if (!PRIVATE_KEY) {
  throw new Error("Set PRIVATE_KEY or DEPLOYER_KEY in .env");
}

function buildNetwork() {
  const base =
    STACKS_NETWORK === "testnet"
      ? STACKS_TESTNET || StacksTestnet
      : STACKS_MAINNET || StacksMainnet;

  const create = createNetworkFn || (networkPkg as any).default?.createNetwork;
  if (create && base) {
    return create({
      network: base,
      client: { baseUrl: STACKS_API_URL || base?.client?.baseUrl },
    });
  }

  // fallback to constructor style
  const ctor =
    STACKS_NETWORK === "testnet"
      ? StacksTestnet ?? (networkPkg as any).default?.StacksTestnet ?? (networkPkg as any).default
      : StacksMainnet ?? (networkPkg as any).default?.StacksMainnet ?? (networkPkg as any).default;

  return new ctor({ url: STACKS_API_URL });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimit(err: any) {
  const msg = JSON.stringify(err || "").toLowerCase();
  return msg.includes("rate") || msg.includes("per-minute");
}

async function fetchNonce(address: string) {
  const url = `${STACKS_API_URL.replace(/\/$/, "")}/v2/accounts/${address}?proof=0`;
  const resp = await fetch(url);
  const json = await resp.json();
  return BigInt(json.nonce ?? 0);
}

async function sendTx(index: number, nonce: bigint) {
  const network = buildNetwork();
  const recipient = RECIPIENT_ADDRESS || CONTRACT_ADDRESS;

  // vary amount for distinct payloads
  const amountBaseUnits = 1000n + BigInt(index);

  console.log(
    `\n[${index}/${TX_COUNT}] transfer ${amountBaseUnits} to ${recipient} (nonce ${nonce})...`,
  );

  try {
    const clarityVersion =
      (ClarityVersion as any).Clarity4 ??
      (ClarityVersion as any).Clarity3 ??
      ClarityVersion ??
      undefined;

    const tx = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "transfer",
      functionArgs: [
        uintCV(amountBaseUnits),
        principalCV(CONTRACT_ADDRESS), // sender (deployer)
        principalCV(recipient),
        noneCV(), // memo
      ],
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      fee: FEE,
      nonce,
      clarityVersion,
    });

    const res = await (broadcastTransaction as any)({ transaction: tx, network });

    if ("error" in res) {
      console.error(`❌ Tx ${index} failed:`, res.error);
      return { ok: false, error: res.error };
    }

    console.log(`✅ Tx ${index} broadcast: ${res.txid}`);
    console.log(
      `🔗 https://explorer.hiro.so/txid/${res.txid}?chain=${STACKS_NETWORK}`,
    );
    return { ok: true, error: null };
  } catch (error: any) {
    console.error(`❌ Tx ${index} threw:`, error);
    return { ok: false, error };
  }
}

async function main() {
  console.log(
    `Sending ${TX_COUNT} transfer txs to ${STACKS_NETWORK} for ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
  );

  let nonce = await fetchNonce(CONTRACT_ADDRESS);
  let success = 0;
  let failed = 0;
  const errors: Array<{ index: number; error: any }> = [];

  for (let i = 1; i <= TX_COUNT; i++) {
    const res = await sendTx(i, nonce);
    nonce += 1n;

    if (res.ok) {
      success++;
    } else {
      failed++;
      errors.push({ index: i, error: res.error });
      if (isRateLimit(res.error) && PAUSE_ON_RATE_LIMIT_MS > 0) {
        console.log(
          `⏸ Rate limit detected, pausing ${PAUSE_ON_RATE_LIMIT_MS}ms before continuing...`,
        );
        await sleep(PAUSE_ON_RATE_LIMIT_MS);
      }
    }

    if (DELAY_MS > 0) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\\nDone. Success: ${success}, Failed: ${failed}`);
  if (errors.length) {
    console.log("Failures:");
    for (const e of errors) {
      console.log(`  #${e.index}: ${JSON.stringify(e.error)}`);
    }
  }
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});


