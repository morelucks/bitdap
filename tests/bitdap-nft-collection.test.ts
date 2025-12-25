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