import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;
const deployer = accounts.get("deployer")!;

const contractName = "bitdap-nft-collection";

describe("Bitdap NFT Collection - Contract Initialization", () => {
  it("should return correct collection name", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-collection-name",
      [],
      address1
    );
    expect(result).toBeOk(Cl.stringAscii("Bitdap NFT Collection"));
  });

  it("should return correct collection symbol", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-collection-symbol",
      [],
      address1
    );
    expect(result).toBeOk(Cl.stringAscii("BDNFT"));
  });

  it("should return correct contract owner", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-contract-owner",
      [],
      address1
    );
    expect(result).toBeOk(Cl.principal(deployer));
  });

  it("should start with zero total supply", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("should start with last token ID as 0", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-last-token-id",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("should not be paused initially", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-contract-status",
      [],
      address1
    );
    expect(result).toBeOk(
      Cl.tuple({
        paused: Cl.bool(false),
        "minting-enabled": Cl.bool(true),
        owner: Cl.principal(deployer)
      })
    );
  });

  it("should return correct contract info", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-contract-info",
      [],
      address1
    );
    expect(result).toBeOk(
      Cl.tuple({
        version: Cl.stringUtf8("2.0.0"),
        name: Cl.stringUtf8("Bitdap NFT Collection"),
        description: Cl.stringUtf8("Enhanced NFT collection contract with approvals, events, and batch operations"),
        "sip-009-compliant": Cl.bool(true),
        features: Cl.list([
          Cl.stringUtf8("minting"),
          Cl.stringUtf8("burning"),
          Cl.stringUtf8("transfers"),
          Cl.stringUtf8("approvals"),
          Cl.stringUtf8("royalties"),
          Cl.stringUtf8("batch-operations"),
          Cl.stringUtf8("pause-controls"),
          Cl.stringUtf8("enhanced-events"),
          Cl.stringUtf8("fund-management")
        ])
      })
    );
  });
});
describe("Bitdap NFT Collection - Minting Functionality", () => {
  it("should allow minting NFT with metadata URI", () => {
    const uri = Cl.some(Cl.stringUtf8("https://example.com/nft/1.json"));
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), uri],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should allow minting NFT without metadata URI", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should increment total supply after minting", () => {
    // Mint first NFT
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      deployer
    );

    // Check total supply
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should update last token ID after minting", () => {
    // Mint first NFT
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      deployer
    );

    // Check last token ID
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-last-token-id",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should set correct owner after minting", () => {
    // Mint NFT
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      deployer
    );

    // Check owner
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.some(Cl.principal(address1)));
  });

  it("should store metadata URI correctly", () => {
    const uri = Cl.some(Cl.stringUtf8("https://example.com/nft/1.json"));
    
    // Mint NFT with URI
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), uri],
      deployer
    );

    // Check URI
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(uri);
  });

  it("should reject minting when contract is paused", () => {
    // Pause contract
    simnet.callPublicFn(
      contractName,
      "pause-contract",
      [],
      deployer
    );

    // Try to mint
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      deployer
    );
    expect(result).toBeErr(Cl.uint(406)); // ERR-CONTRACT-PAUSED
  });

  it("should reject minting when minting is disabled", () => {
    // Disable minting
    simnet.callPublicFn(
      contractName,
      "set-minting-enabled",
      [Cl.bool(false)],
      deployer
    );

    // Try to mint
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      deployer
    );
    expect(result).toBeErr(Cl.uint(406)); // ERR-CONTRACT-PAUSED
  });
});
describe("Bitdap NFT Collection - Transfer Functionality", () => {
  beforeEach(() => {
    // Mint NFT for transfer tests
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.some(Cl.stringUtf8("https://example.com/nft/1.json"))],
      deployer
    );
  });

  it("should allow owner to transfer NFT", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify new owner
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(ownerResult.result).toBeOk(Cl.some(Cl.principal(address2)));
  });

  it("should reject transfer from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address2 // Non-owner trying to transfer
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject self-transfer", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address1)],
      address1
    );
    expect(result).toBeErr(Cl.uint(407)); // ERR-SELF-TRANSFER
  });

  it("should reject transfer of non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(999), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-NOT-FOUND
  });

  it("should reject transfer when contract is paused", () => {
    // Pause contract
    simnet.callPublicFn(
      contractName,
      "pause-contract",
      [],
      deployer
    );

    // Try to transfer
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(result).toBeErr(Cl.uint(406)); // ERR-CONTRACT-PAUSED
  });

  it("should support transfer with memo", () => {
    const memo = new TextEncoder().encode("Transfer memo");
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-memo",
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2), Cl.buffer(memo)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify transfer occurred
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(ownerResult.result).toBeOk(Cl.some(Cl.principal(address2)));
  });
});