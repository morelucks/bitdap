type NetworkKey = "mainnet" | "testnet";

const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK;
const network: NetworkKey = networkEnv === "testnet" ? "testnet" : "mainnet";

const explorerBase =
  process.env.NEXT_PUBLIC_HIRO_EXPLORER_BASE ?? "https://explorer.hiro.so";
const apiBase =
  process.env.NEXT_PUBLIC_HIRO_API_BASE ?? "https://api.hiro.so";

const bitdapAddress =
  process.env.NEXT_PUBLIC_BITDAP_CONTRACT ?? "SPXXXX.bitdap";
const bitdapTokenAddress =
  process.env.NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT ?? "SPXXXX.bitdap-token";

export const contractsConfig = {
  network,
  explorerBase,
  apiBase,
  bitdap: {
    address: bitdapAddress,
    explorerUrl: `${explorerBase}/contract/${bitdapAddress}?chain=${network}`
  },
  bitdapToken: {
    address: bitdapTokenAddress,
    explorerUrl: `${explorerBase}/contract/${bitdapTokenAddress}?chain=${network}`
  }
};

export const formatNetworkLabel = (key: NetworkKey) =>
  key === "mainnet" ? "Stacks Mainnet" : "Stacks Testnet";

