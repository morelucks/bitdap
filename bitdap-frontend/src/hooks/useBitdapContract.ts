"use client";

import { useState, useCallback } from "react";
import { useConnect } from "@stacks/connect-react";
import { makeContractCall, broadcastTransaction, uintCV, principalCV, noneCV, someCV, stringUtf8CV, ClarityValue } from "@stacks/transactions";
import { contractsConfig } from "@config/contracts";
import { useWallet } from "@context/WalletContext";

export function useBitdapContract() {
  const { doContractCall } = useConnect();
  const { network, address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = contractsConfig.bitdap.address.split(".")[0];
  const contractName = contractsConfig.bitdap.address.split(".")[1] || "bitdap";

  const handleCall = useCallback(
    async (
      functionName: string,
      functionArgs: ClarityValue[],
      postConditions?: any[]
    ) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await doContractCall({
          contractAddress,
          contractName,
          functionName,
          functionArgs,
          network,
          postConditions,
          onFinish: (data) => {
            console.log("Transaction finished:", data);
            setLoading(false);
          },
          onCancel: () => {
            setError("Transaction cancelled");
            setLoading(false);
          },
        });
        return result;
      } catch (err: any) {
        setError(err.message || "Transaction failed");
        setLoading(false);
        return null;
      }
    },
    [address, contractAddress, contractName, network, doContractCall]
  );

  const mintPass = useCallback(
    async (tier: number, uri?: string) => {
      const args = [
        uintCV(tier),
        uri ? someCV(stringUtf8CV(uri)) : noneCV(),
      ];
      return handleCall("mint-pass", args);
    },
    [handleCall]
  );

  const transfer = useCallback(
    async (tokenId: number, recipient: string) => {
      const args = [uintCV(tokenId), principalCV(recipient)];
      return handleCall("transfer", args);
    },
    [handleCall]
  );

  const burn = useCallback(
    async (tokenId: number) => {
      const args = [uintCV(tokenId)];
      return handleCall("burn", args);
    },
    [handleCall]
  );

  const pause = useCallback(async () => {
    return handleCall("pause", []);
  }, [handleCall]);

  const unpause = useCallback(async () => {
    return handleCall("unpause", []);
  }, [handleCall]);

  const setTokenUri = useCallback(
    async (tokenId: number, uri: string) => {
      const args = [uintCV(tokenId), stringUtf8CV(uri)];
      return handleCall("set-token-uri", args);
    },
    [handleCall]
  );

  return {
    loading,
    error,
    mintPass,
    transfer,
    burn,
    pause,
    unpause,
    setTokenUri,
    contractAddress: `${contractAddress}.${contractName}`,
  };
}

