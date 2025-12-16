/**
 * Chainhooks Integration for Bitdap Pass
 * 
 * This file demonstrates how to use chainhooks to track Bitdap Pass events
 * (mint-event, transfer-event, burn-event) on the Stacks blockchain.
 */

import { ChainhookClient } from "@hirosystems/chainhooks-client";

// Initialize chainhook client
// For testnet: https://api.testnet.hiro.so
// For mainnet: https://api.hiro.so
const chainhookClient = new ChainhookClient({
  apiUrl: process.env.CHAINHOOK_API_URL || "https://api.testnet.hiro.so",
  apiKey: process.env.CHAINHOOK_API_KEY || "",
});

/**
 * Register a chainhook to track mint events
 */
export async function registerMintEventHook(contractAddress: string) {
  const hook = {
    uuid: `bitdap-mint-${Date.now()}`,
    name: "Bitdap Pass Mint Events",
    network: "stacks",
    version: 1,
    predicate: {
      scope: "contract_identifier",
      contract_identifier: contractAddress,
      function_identifier: "mint-pass",
    },
    action: {
      http: {
        url: process.env.WEBHOOK_URL || "http://localhost:3000/webhook/mint",
        method: "POST",
      },
    },
  };

  try {
    const result = await chainhookClient.registerHook(hook);
    console.log("Mint event hook registered:", result);
    return result;
  } catch (error) {
    console.error("Error registering mint hook:", error);
    throw error;
  }
}

/**
 * Register a chainhook to track transfer events
 */
export async function registerTransferEventHook(contractAddress: string) {
  const hook = {
    uuid: `bitdap-transfer-${Date.now()}`,
    name: "Bitdap Pass Transfer Events",
    network: "stacks",
    version: 1,
    predicate: {
      scope: "contract_identifier",
      contract_identifier: contractAddress,
      function_identifier: "transfer",
    },
    action: {
      http: {
        url: process.env.WEBHOOK_URL || "http://localhost:3000/webhook/transfer",
        method: "POST",
      },
    },
  };

  try {
    const result = await chainhookClient.registerHook(hook);
    console.log("Transfer event hook registered:", result);
    return result;
  } catch (error) {
    console.error("Error registering transfer hook:", error);
    throw error;
  }
}

/**
 * Register a chainhook to track burn events
 */
export async function registerBurnEventHook(contractAddress: string) {
  const hook = {
    uuid: `bitdap-burn-${Date.now()}`,
    name: "Bitdap Pass Burn Events",
    network: "stacks",
    version: 1,
    predicate: {
      scope: "contract_identifier",
      contract_identifier: contractAddress,
      function_identifier: "burn",
    },
    action: {
      http: {
        url: process.env.WEBHOOK_URL || "http://localhost:3000/webhook/burn",
        method: "POST",
      },
    },
  };

  try {
    const result = await chainhookClient.registerHook(hook);
    console.log("Burn event hook registered:", result);
    return result;
  } catch (error) {
    console.error("Error registering burn hook:", error);
    throw error;
  }
}

/**
 * Register all Bitdap Pass event hooks
 */
export async function registerAllHooks(contractAddress: string) {
  console.log("Registering all Bitdap Pass event hooks...");
  
  await Promise.all([
    registerMintEventHook(contractAddress),
    registerTransferEventHook(contractAddress),
    registerBurnEventHook(contractAddress),
  ]);
  
  console.log("All hooks registered successfully!");
}

/**
 * Parse mint event from print statement
 */
export function parseMintEvent(printStatement: any) {
  // The print statement contains the event data
  // Format: { event: "mint-event", token-id: u1, owner: principal, tier: u1 }
  if (printStatement && printStatement.event === "mint-event") {
    return {
      event: "mint-event",
      tokenId: printStatement["token-id"] || printStatement.token_id,
      owner: printStatement.owner,
      tier: printStatement.tier,
      timestamp: new Date().toISOString(),
    };
  }
  return null;
}

/**
 * Parse transfer event from print statement
 */
export function parseTransferEvent(printStatement: any) {
  if (printStatement && printStatement.event === "transfer-event") {
    return {
      event: "transfer-event",
      tokenId: printStatement["token-id"] || printStatement.token_id,
      from: printStatement.from,
      to: printStatement.to,
      timestamp: new Date().toISOString(),
    };
  }
  return null;
}

/**
 * Parse burn event from print statement
 */
export function parseBurnEvent(printStatement: any) {
  if (printStatement && printStatement.event === "burn-event") {
    return {
      event: "burn-event",
      tokenId: printStatement["token-id"] || printStatement.token_id,
      owner: printStatement.owner,
      tier: printStatement.tier,
      timestamp: new Date().toISOString(),
    };
  }
  return null;
}

/**
 * Process chainhook payload and extract Bitdap events
 */
export function processChainhookPayload(payload: any) {
  const events: any[] = [];
  
  if (payload.apply && payload.apply.transactions) {
    for (const tx of payload.apply.transactions) {
      if (tx.metadata && tx.metadata.prints) {
        for (const print of tx.metadata.prints) {
          // Try to parse each event type
          const mintEvent = parseMintEvent(print);
          if (mintEvent) events.push(mintEvent);
          
          const transferEvent = parseTransferEvent(print);
          if (transferEvent) events.push(transferEvent);
          
          const burnEvent = parseBurnEvent(print);
          if (burnEvent) events.push(burnEvent);
        }
      }
    }
  }
  
  return events;
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const contractAddress = process.env.BITDAP_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitdap";
  
  registerAllHooks(contractAddress)
    .then(() => {
      console.log("Setup complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

