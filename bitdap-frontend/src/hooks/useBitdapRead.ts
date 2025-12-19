"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCallReadOnlyFunction, uintCV, principalCV, cvToJSON, ClarityValue } from "@stacks/transactions";
import { contractsConfig } from "@config/contracts";
import { useWallet } from "@context/WalletContext";

const contractAddress = contractsConfig.bitdap.address.split(".")[0];
const contractName = contractsConfig.bitdap.address.split(".")[1] || "bitdap";

export function useBitdapRead() {
  const { network, address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readCall = useCallback(
    async (functionName: string, functionArgs: ClarityValue[] = [], sender?: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName,
          functionArgs,
          network,
          senderAddress: sender || address || contractAddress,
        });

        const json = cvToJSON(result);
        setLoading(false);
        return json;
      } catch (err: any) {
        setError(err.message || "Read failed");
        setLoading(false);
        return null;
      }
    },
    [network, address]
  );

  const getTokenOwner = useCallback(
    async (tokenId: number) => {
      return readCall("get-owner", [uintCV(tokenId)]);
    },
    [readCall]
  );

  const getTokenMetadata = useCallback(
    async (tokenId: number) => {
      return readCall("get-token-metadata", [uintCV(tokenId)]);
    },
    [readCall]
  );

  const getTotalSupply = useCallback(async () => {
    return readCall("get-total-supply", []);
  }, [readCall]);

  const getNextTokenId = useCallback(async () => {
    return readCall("get-next-token-id", []);
  }, [readCall]);

  const getTierSupply = useCallback(
    async (tier: number) => {
      return readCall("get-tier-supply", [uintCV(tier)]);
    },
    [readCall]
  );

  const isPaused = useCallback(async () => {
    return readCall("is-paused", []);
  }, [readCall]);

  const getOwnedTokens = useCallback(
    async (owner: string) => {
      // Note: This requires iterating or a helper function in the contract
      // For now, we'll return null and handle it differently
      return null;
    },
    [readCall]
  );

  return {
    loading,
    error,
    getTokenOwner,
    getTokenMetadata,
    getTotalSupply,
    getNextTokenId,
    getTierSupply,
    isPaused,
    getOwnedTokens,
  };
}
