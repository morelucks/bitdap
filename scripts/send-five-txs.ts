import txPkg from "@stacks/transactions";
import * as networkPkg from "@stacks/network";
import fetch from "cross-fetch";

const StacksMainnet =
  (networkPkg as any).StacksMainnet ??
  (networkPkg as any).default?.StacksMainnet ??
  (networkPkg as any).default;
const {
  AnchorMode,
  broadcastTransaction,
  contractCall,
  noneCV,
  principalCV,
  uintCV,
} = txPkg as any;

// Constants
const CONTRACT_ADDR = "SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB";
const CONTRACT_NAME = "bitdap-token";
const FUNCTION_NAME = "transfer";
const TOKEN_DECIMALS = 6n; // from contract

async function main() {
  const senderKey = process.env.PRIVATE_KEY?.trim();
  if (!senderKey) {
    throw new Error("PRIVATE_KEY not set");
  }

  const recipient =
    process.env.RECIPIENT || "SP3F13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ";

  // amount: 0.001 token -> 1000 base units (10^(decimals-3))
  const amountBaseUnits = 1000n;

  const senderAddr = CONTRACT_ADDR; // deployer address

  const network = new StacksMainnet({ url: "https://api.hiro.so" });

  // fetch current nonce
  const nonceResp = await fetch(
    `https://api.hiro.so/v2/accounts/${senderAddr}?proof=0`
  );
  const nonceJson = await nonceResp.json();
  let nonce = BigInt(nonceJson.nonce);

  // simple fee; bump if mempool is busy
  let fee = 300n;

  for (let i = 0; i < 5; i++) {
    const tx = await contractCall({
      contractAddress: CONTRACT_ADDR,
      contractName: CONTRACT_NAME,
      functionName: FUNCTION_NAME,
      functionArgs: [
        uintCV(amountBaseUnits),
        principalCV(senderAddr),
        principalCV(recipient),
        noneCV(),
      ],
      senderKey,
      network,
      anchorMode: AnchorMode.Any,
      fee,
      nonce,
    });

    const res = await broadcastTransaction(tx, network);
    console.log(`tx${i + 1} nonce=${nonce} fee=${fee}:`, res);

    // increment nonce
    nonce += 1n;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

