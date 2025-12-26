import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@context/WalletContext";
import { ThemeProvider } from "@context/ThemeContext";
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
        <ThemeProvider>
          <WalletProvider>{children}</WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
