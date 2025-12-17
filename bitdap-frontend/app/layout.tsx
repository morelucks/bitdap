import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitdap Frontend",
  description: "Minimal scaffold for Bitdap contracts (bitdap, bitdap-token)"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

