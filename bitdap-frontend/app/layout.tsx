import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@context/WalletContext";

export const metadata: Metadata = {
  title: "Bitdap - NFT Pass Collection",
  description: "Bitdap Pass - tiered membership NFT collection on Stacks"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}

