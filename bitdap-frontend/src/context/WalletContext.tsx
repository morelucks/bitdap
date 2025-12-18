"use client";

import { createContext, useContext, ReactNode } from "react";
import { useConnect } from "@stacks/connect-react";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { contractsConfig } from "@config/contracts";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  network: StacksMainnet | StacksTestnet;
  connect: () => void;
  disconnect: () => void;
  userData: any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { authenticate, userData } = useConnect();

  const network =
    contractsConfig.network === "mainnet"
      ? new StacksMainnet({ url: contractsConfig.apiBase })
      : new StacksTestnet({ url: contractsConfig.apiBase });

  const address =
    userData?.profile?.stxAddress?.[contractsConfig.network] || null;
  const isConnected = !!address;

  const connect = () => {
    authenticate({
      appDetails: {
        name: "Bitdap",
        icon: "https://bitdap.com/icon.png",
      },
      network,
      onFinish: () => {
        console.log("Wallet connected");
      },
      onCancel: () => {
        console.log("Connection cancelled");
      },
    });
  };

  const disconnect = () => {
    // Note: @stacks/connect-react doesn't have a built-in disconnect
    // User would need to disconnect from their wallet extension
    // This is a placeholder for future implementation
    console.log("Disconnect - user must disconnect from wallet extension");
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        network,
        connect,
        disconnect,
        userData,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
