import type { Metadata } from "next";
import "./globals.css";
import { ConnectProvider } from "@stacks/connect-react";
import { WalletProvider } from "@context/WalletContext";
import { contractsConfig } from "@config/contracts";
import { StacksMainnet, StacksTestnet } from "@stacks/network";

export const metadata: Metadata = {
  title: "Bitdap - NFT Pass Collection",
  description: "Bitdap Pass - tiered membership NFT collection on Stacks"
};

const network =
  contractsConfig.network === "mainnet"
    ? new StacksMainnet({ url: contractsConfig.apiBase })
    : new StacksTestnet({ url: contractsConfig.apiBase });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConnectProvider>
          <WalletProvider>{children}</WalletProvider>
        </ConnectProvider>
      </body>
    </html>
  );
}

