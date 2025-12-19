type NetworkKey = "mainnet" | "testnet";

// Network configuration from environment
const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK;
const network: NetworkKey = networkEnv === "testnet" ? "testnet" : "mainnet";

// API and Explorer URLs
const explorerBase =
  process.env.NEXT_PUBLIC_HIRO_EXPLORER_BASE ?? 
  (network === "testnet" ? "https://explorer.hiro.so" : "https://explorer.hiro.so");
const apiBase =
  process.env.NEXT_PUBLIC_HIRO_API_BASE ?? 
  (network === "testnet" ? "https://api.testnet.hiro.so" : "https://api.hiro.so");

// Contract addresses from environment (REQUIRED)
// Mainnet deployer: SPGDMV1EMAKT9N8NTP9KXM2PC14CDS37HHJSX8XQ
const bitdapAddress =
  process.env.NEXT_PUBLIC_BITDAP_CONTRACT ?? 
  (network === "testnet" ? "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap" : "SPGDMV1EMAKT9N8NTP9KXM2PC14CDS37HHJSX8XQ.bitdap");
const bitdapTokenAddress =
  process.env.NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT ?? 
  (network === "testnet" ? "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap-token" : "SPGDMV1EMAKT9N8NTP9KXM2PC14CDS37HHJSX8XQ.bitdap-token");

// Chainhooks configuration
const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL ?? "http://localhost:3000/api/webhooks";
const chainhookApiUrl = process.env.NEXT_PUBLIC_CHAINHOOK_API_URL ?? apiBase;

// Validate contract addresses
if (!bitdapAddress.includes(".")) {
  console.warn("⚠️  Invalid BITDAP_CONTRACT format. Expected: SPXXXX.contract-name");
}
if (!bitdapTokenAddress.includes(".")) {
  console.warn("⚠️  Invalid BITDAP_TOKEN_CONTRACT format. Expected: SPXXXX.contract-name");
}

export const contractsConfig = {
  network,
  explorerBase,
  apiBase,
  webhookUrl,
  chainhookApiUrl,
  bitdap: {
    address: bitdapAddress,
    contractAddress: bitdapAddress.split(".")[0],
    contractName: bitdapAddress.split(".")[1] || "bitdap",
    explorerUrl: `${explorerBase}/contract/${bitdapAddress}?chain=${network}`
  },
  bitdapToken: {
    address: bitdapTokenAddress,
    contractAddress: bitdapTokenAddress.split(".")[0],
    contractName: bitdapTokenAddress.split(".")[1] || "bitdap-token",
    explorerUrl: `${explorerBase}/contract/${bitdapTokenAddress}?chain=${network}`
  }
};

export const formatNetworkLabel = (key: NetworkKey) =>
  key === "mainnet" ? "Stacks Mainnet" : "Stacks Testnet";

