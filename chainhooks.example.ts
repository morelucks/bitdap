/**
 * Example: Webhook handler for Bitdap Pass events
 * 
 * This example shows how to handle chainhook webhooks
 * and process Bitdap Pass events (mint, transfer, burn)
 */

import { processChainhookPayload, parseMintEvent, parseTransferEvent, parseBurnEvent } from "./chainhooks";

// Example Express.js webhook handler
export function handleBitdapWebhook(req: any, res: any) {
  try {
    const payload = req.body;
    const events = processChainhookPayload(payload);
    
    // Process each event
    for (const event of events) {
      switch (event.event) {
        case "mint-event":
          handleMintEvent(event);
          break;
        case "transfer-event":
          handleTransferEvent(event);
          break;
        case "burn-event":
          handleBurnEvent(event);
          break;
      }
    }
    
    res.status(200).json({ received: true, events: events.length });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

function handleMintEvent(event: any) {
  console.log("🎉 New Bitdap Pass minted!");
  console.log(`  Token ID: ${event.tokenId}`);
  console.log(`  Owner: ${event.owner}`);
  console.log(`  Tier: ${getTierName(event.tier)}`);
  
  // Example: Update database, send notification, etc.
  // await database.insertMint(event);
  // await sendNotification(event.owner, "Your Bitdap Pass has been minted!");
}

function handleTransferEvent(event: any) {
  console.log("🔄 Bitdap Pass transferred!");
  console.log(`  Token ID: ${event.tokenId}`);
  console.log(`  From: ${event.from}`);
  console.log(`  To: ${event.to}`);
  
  // Example: Update ownership records
  // await database.updateOwnership(event.tokenId, event.to);
}

function handleBurnEvent(event: any) {
  console.log("🔥 Bitdap Pass burned!");
  console.log(`  Token ID: ${event.tokenId}`);
  console.log(`  Owner: ${event.owner}`);
  console.log(`  Tier: ${getTierName(event.tier)}`);
  
  // Example: Remove from database, update analytics
  // await database.removeToken(event.tokenId);
}

function getTierName(tier: number): string {
  switch (tier) {
    case 1:
      return "Basic";
    case 2:
      return "Pro";
    case 3:
      return "VIP";
    default:
      return "Unknown";
  }
}

