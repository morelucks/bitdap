import { NextRequest, NextResponse } from "next/server";
import { contractsConfig } from "@config/contracts";

/**
 * Webhook endpoint for Chainhooks
 * Receives events from Hiro Chainhooks and processes them
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Verify this is a valid chainhook payload
    if (!payload || !payload.apply) {
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    const events: any[] = [];

    // Process transactions in the payload
    if (payload.apply.transactions) {
      for (const tx of payload.apply.transactions) {
        // Check if this transaction involves our contract
        const contractCall = tx.metadata?.kind?.data;
        if (contractCall) {
          const contractId = `${contractCall.contract_identifier}`;
          
          // Check if it's our bitdap contract
          if (contractId === contractsConfig.bitdap.address) {
            // Process print statements (events)
            if (tx.metadata?.prints) {
              for (const print of tx.metadata.prints) {
                const event = parseEvent(print, tx.metadata?.tx_id);
                if (event) {
                  events.push(event);
                }
              }
            }
          }
        }
      }
    }

    // Store events (in production, use a database)
    // For now, we'll just return them
    // In a real app, you'd store these in Redis, Postgres, etc.

    return NextResponse.json({
      success: true,
      eventsReceived: events.length,
      events,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Parse a print statement into a Bitdap event
 */
function parseEvent(print: any, txId?: string): any | null {
  try {
    // Print statements from Clarity contracts
    // Format depends on how events are emitted in the contract
    const printValue = print?.value || print;
    
    if (typeof printValue === "string") {
      // Try to parse JSON-like strings
      try {
        const parsed = JSON.parse(printValue);
        if (parsed.event) {
          return {
            event: parsed.event,
            tokenId: parsed["token-id"] || parsed.token_id,
            owner: parsed.owner,
            from: parsed.from,
            to: parsed.to,
            tier: parsed.tier,
            timestamp: new Date().toISOString(),
            txId,
          };
        }
      } catch {
        // Not JSON, check for event patterns
        if (printValue.includes("mint-event")) {
          return {
            event: "mint-event",
            timestamp: new Date().toISOString(),
            txId,
          };
        }
      }
    }

    // Handle tuple format
    if (printValue && typeof printValue === "object") {
      const event = printValue.event || printValue["event"];
      if (event) {
        return {
          event,
          tokenId: printValue["token-id"] || printValue.token_id,
          owner: printValue.owner,
          from: printValue.from,
          to: printValue.to,
          tier: printValue.tier,
          timestamp: new Date().toISOString(),
          txId,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing event:", error);
    return null;
  }
}

/**
 * GET endpoint to retrieve stored events
 */
export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database
    // For now, return empty array
    return NextResponse.json({
      events: [],
      message: "Events are stored client-side. Use POST to receive webhook events.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

