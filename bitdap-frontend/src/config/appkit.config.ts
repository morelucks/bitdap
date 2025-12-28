/**
 * AppKit Configuration
 * Configures Web3Modal with Stacks network support and wallet adapters
 */

export const appKitConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [
    {
      chainId: 1,
      name: 'Stacks Mainnet',
      currency: 'STX',
      explorerUrl: 'https://explorer.stacks.co',
      rpcUrl: 'https://stacks-node-api.mainnet.stacks.co:20443',
    },
    {
      chainId: 2147483648,
      name: 'Stacks Testnet',
      currency: 'STX',
      explorerUrl: 'https://testnet-explorer.stacks.co',
      rpcUrl: 'https://stacks-node-api.testnet.stacks.co:20443',
    },
  ],
  metadata: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Bitdap',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'NFT Pass Collection on Stacks',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
};

export type AppKitConfig = typeof appKitConfig;
