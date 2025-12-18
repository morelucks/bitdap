"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from "react";
import { showConnect } from "@stacks/connect";
import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";
import { contractsConfig } from "@config/contracts";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  network: any;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const network = useMemo(() => {
    return contractsConfig.network === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
  }, []);

  // Load saved address from localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem("bitdap_wallet_address");
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  const connect = useCallback(() => {
    setIsConnecting(true);
    
    showConnect({
      appDetails: {
        name: "Bitdap",
        icon: "https://bitdap.com/icon.png",
      },
      network,
      onFinish: (data) => {
        const userAddress = data.profile?.stxAddress?.[contractsConfig.network];
        if (userAddress) {
          setAddress(userAddress);
          localStorage.setItem("bitdap_wallet_address", userAddress);
        }
        setIsConnecting(false);
      },
      onCancel: () => {
        setIsConnecting(false);
      },
    });
  }, [network]);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem("bitdap_wallet_address");
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!address,
        address,
        network,
        connect,
        disconnect,
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
