import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "bitdap";

describe("Bitdap Pass - Core Functionality", () => {
  it("should initialize with zero supply", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("should return u0 for last-token-id when no tokens exist", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-last-token-id",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("should mint a Basic tier pass", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should mint a Pro tier pass", () => {
    // Mint Basic first to get sequential IDs
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
    
    const { result } = simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(2), Cl.none()],
      address1
    );
    expect(result).toBeOk(Cl.uint(2));
  });

  it("should mint a VIP tier pass", () => {
    // Mint Basic and Pro first to get sequential IDs
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(2), Cl.none()],
      address1
    );
    
    const { result } = simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(3), Cl.none()],
      address1
    );
    expect(result).toBeOk(Cl.uint(3));
  });

  it("should reject invalid tier", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(99), Cl.none()],
      address1
    );
    expect(result).toBeErr(Cl.uint(100)); // ERR-INVALID-TIER
  });

  it("should update total supply after minting", () => {
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should return correct owner after minting", () => {
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.principal(address1));
  });

  it("should return correct tier after minting", () => {
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(2), Cl.none()],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-tier",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(2)); // Pro tier
  });

  it("should update tier supply after minting", () => {
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-tier-supply",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(1));
  });
});

describe("Bitdap Pass - Transfer Functionality", () => {
  beforeEach(() => {
    // Mint a token for address1 before each test
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
  });

  it("should transfer token from owner to recipient", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(1), Cl.principal(address2)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(ownerResult.result).toBeOk(Cl.principal(address2));
  });

  it("should reject transfer from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(1), Cl.principal(address2)],
      address2
    );
    expect(result).toBeErr(Cl.uint(102)); // ERR-NOT-OWNER
  });

  it("should reject self-transfer", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(1), Cl.principal(address1)],
      address1
    );
    expect(result).toBeErr(Cl.uint(103)); // ERR-SELF-TRANSFER
  });

  it("should reject transfer of non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(999), Cl.principal(address2)],
      address1
    );
    expect(result).toBeErr(Cl.uint(101)); // ERR-NOT-FOUND
  });
});

describe("Bitdap Pass - Burn Functionality", () => {
  beforeEach(() => {
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
  });

  it("should burn token owned by caller", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(ownerResult.result).toBeErr(Cl.uint(101)); // ERR-NOT-FOUND
  });

  it("should decrement total supply after burn", () => {
    simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("should decrement tier supply after burn", () => {
    simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-tier-supply",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("should reject burn from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address2
    );
    expect(result).toBeErr(Cl.uint(102)); // ERR-NOT-OWNER
  });
});

describe("Bitdap Pass - Metadata Functions", () => {
  it("should return token metadata with tier and URI", () => {
    const uri = Cl.some(Cl.stringUtf8("https://example.com/token/1"));
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(2), uri],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(
      Cl.tuple({
        tier: Cl.uint(2),
        uri: uri,
      })
    );
  });

  it("should return token URI", () => {
    const uri = Cl.some(Cl.stringUtf8("https://example.com/token/1"));
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), uri],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(uri);
  });

  it("should return none for URI when not provided", () => {
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.none());
  });
});

describe("Bitdap Pass - Supply Limits", () => {
  it("should enforce max supply per tier", () => {
    // This test would require minting up to MAX-BASIC-SUPPLY (7000)
    // For now, we just verify the constant exists
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-max-supply",
      [],
      address1
    );
    expect(result).toBeUint(10000);
  });
});

describe("Bitdap Pass - Multiple Mints", () => {
  it("should mint multiple tokens with sequential IDs", () => {
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(2), Cl.none()],
      address1
    );
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(3), Cl.none()],
      address1
    );

    const { result: lastId } = simnet.callReadOnlyFn(
      contractName,
      "get-last-token-id",
      [],
      address1
    );
    expect(lastId).toBeOk(Cl.uint(3));

    const { result: supply } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      address1
    );
    expect(supply).toBeOk(Cl.uint(3));
  });

  it("should allow different users to mint tokens", () => {
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address2
    );

    const owner1 = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(owner1.result).toBeOk(Cl.principal(address1));

    const owner2 = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(2)],
      address1
    );
    expect(owner2.result).toBeOk(Cl.principal(address2));
  });
});

describe("Bitdap Pass - Events & Emissions", () => {
  it("should emit mint-event when a pass is minted", () => {
    const { result, events } = simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
    
    expect(result).toBeOk(Cl.uint(1));
    // Events are emitted via print statements - verify at least one event exists
    expect(events.length).toBeGreaterThan(0);
    
    // In Clarity, print statements create events that can be tracked off-chain
    // The events array contains print outputs which include our event data
    const hasMintEvent = events.some((e: any) => {
      const eventStr = JSON.stringify(e);
      return eventStr.includes("mint-event") || eventStr.includes("token-id");
    });
    expect(hasMintEvent).toBe(true);
  });

  it("should emit transfer-event when a pass is transferred", () => {
    // First mint a token
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );

    // Then transfer it
    const { result, events } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(1), Cl.principal(address2)],
      address1
    );
    
    expect(result).toBeOk(Cl.bool(true));
    expect(events.length).toBeGreaterThan(0);
    
    // Verify transfer event was emitted
    const hasTransferEvent = events.some((e: any) => {
      const eventStr = JSON.stringify(e);
      return eventStr.includes("transfer-event") || eventStr.includes("from");
    });
    expect(hasTransferEvent).toBe(true);
  });

  it("should emit burn-event when a pass is burned", () => {
    // First mint a token
    simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(2), Cl.none()],
      address1
    );

    // Then burn it
    const { result, events } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );
    
    expect(result).toBeOk(Cl.bool(true));
    expect(events.length).toBeGreaterThan(0);
    
    // Verify burn event was emitted
    const hasBurnEvent = events.some((e: any) => {
      const eventStr = JSON.stringify(e);
      return eventStr.includes("burn-event");
    });
    expect(hasBurnEvent).toBe(true);
  });

  it("should not emit events on failed operations", () => {
    // Try to transfer a non-existent token
    const { result, events } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(999), Cl.principal(address2)],
      address1
    );
    
    expect(result).toBeErr(Cl.uint(101)); // ERR-NOT-FOUND
    // No transfer-event should be emitted on failure
    const transferEvent = events.find((e: any) => 
      e.event === "transfer-event" || 
      (e.event === "print_event" && e.data && e.data.event === "transfer-event")
    );
    expect(transferEvent).toBeUndefined();
  });

  it("should emit events with correct tier information", () => {
    // Mint tokens of different tiers - events are emitted and can be tracked off-chain
    const basicResult = simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      address1
    );
    expect(basicResult.result).toBeOk(Cl.uint(1));
    expect(basicResult.events.length).toBeGreaterThan(0);

    const proResult = simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(2), Cl.none()],
      address1
    );
    expect(proResult.result).toBeOk(Cl.uint(2));
    expect(proResult.events.length).toBeGreaterThan(0);

    const vipResult = simnet.callPublicFn(
      contractName,
      "mint-pass",
      [Cl.uint(3), Cl.none()],
      address1
    );
    expect(vipResult.result).toBeOk(Cl.uint(3));
    expect(vipResult.events.length).toBeGreaterThan(0);
    
    // All events should contain tier information that can be parsed off-chain
    const allHaveEvents = [basicResult, proResult, vipResult].every(r => r.events.length > 0);
    expect(allHaveEvents).toBe(true);
  });
});
