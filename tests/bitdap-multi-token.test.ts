import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;
const deployer = accounts.get("deployer")!;

const contractName = "bitdap-multi-token";

describe("Bitdap Multi Token - Contract Initialization", () => {
  it("should return correct contract name", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-name",
      [],
      address1
    );
    expect(result).toBeOk(Cl.stringUtf8("Bitdap Multi Token"));
  });

  it("should return correct contract owner", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [],
      address1
    );
    expect(result).toBeOk(Cl.principal(deployer));
  });

  it("should not be paused initially", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "is-paused",
      [],
      address1
    );
    expect(result).toBeOk(Cl.bool(false));
  });

  it("should start with next token ID as 1", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-next-token-id",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(1));
  });
});

describe("Bitdap Multi Token - Token Creation", () => {
  it("should allow owner to create a fungible token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Bitdap Coin"),
        Cl.stringUtf8("BTC"),
        Cl.uint(8),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/btc.json"))
      ],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should allow owner to create a non-fungible token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Bitdap NFT"),
        Cl.stringUtf8("BNFT"),
        Cl.uint(0),
        Cl.bool(false),
        Cl.some(Cl.stringUtf8("https://example.com/nft.json"))
      ],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should reject token creation from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Unauthorized Token"),
        Cl.stringUtf8("UNAUTH"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      address1
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should increment next token ID after creation", () => {
    // Create first token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Token 1"),
        Cl.stringUtf8("T1"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );

    // Check next token ID
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-next-token-id",
      [],
      address1
    );
    expect(result).toBeOk(Cl.uint(2));
  });

  it("should store correct token metadata", () => {
    // Create token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Test Token"),
        Cl.stringUtf8("TEST"),
        Cl.uint(6),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://test.com/metadata.json"))
      ],
      deployer
    );

    // Check metadata
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8("Test Token"),
        symbol: Cl.stringUtf8("TEST"),
        decimals: Cl.uint(6),
        "total-supply": Cl.uint(0),
        "is-fungible": Cl.bool(true),
        uri: Cl.some(Cl.stringUtf8("https://test.com/metadata.json"))
      })
    );
  });

  it("should confirm token exists after creation", () => {
    // Create token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Exists Token"),
        Cl.stringUtf8("EXISTS"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );

    // Check if token exists
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "token-exists",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should return false for non-existent token", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "token-exists",
      [Cl.uint(999)],
      address1
    );
    expect(result).toBeOk(Cl.bool(false));
  });
});
describe("Bitdap Multi Token - Minting", () => {
  beforeEach(() => {
    // Create a test token before each minting test
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Test Token"),
        Cl.stringUtf8("TEST"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
  });

  it("should allow owner to mint tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should update balance after minting", () => {
    // Mint tokens
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );

    // Check balance
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(1000));
  });

  it("should update total supply after minting", () => {
    // Mint tokens
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(500)],
      deployer
    );

    // Check total supply
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(500));
  });

  it("should reject minting from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      address1
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject minting zero amount", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(0)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should reject minting for non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(999), Cl.uint(1000)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });

  it("should accumulate balance on multiple mints", () => {
    // First mint
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(500)],
      deployer
    );

    // Second mint
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(300)],
      deployer
    );

    // Check accumulated balance
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(800));
  });

  it("should return zero balance for unminted tokens", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(0));
  });
});
describe("Bitdap Multi Token - Batch Minting", () => {
  beforeEach(() => {
    // Create multiple test tokens
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Token 1"),
        Cl.stringUtf8("T1"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Token 2"),
        Cl.stringUtf8("T2"),
        Cl.uint(6),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Token 3"),
        Cl.stringUtf8("T3"),
        Cl.uint(0),
        Cl.bool(false),
        Cl.none()
      ],
      deployer
    );
  });

  it("should allow owner to batch mint multiple tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3)]),
        Cl.list([Cl.uint(1000), Cl.uint(500), Cl.uint(1)])
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should reject batch mint from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(1000), Cl.uint(500)])
      ],
      address1
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject batch mint with mismatched array lengths", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3)]),
        Cl.list([Cl.uint(1000), Cl.uint(500)]) // Mismatched length
      ],
      deployer
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should update balances correctly after batch mint", () => {
    // Batch mint
    simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3)]),
        Cl.list([Cl.uint(1000), Cl.uint(500), Cl.uint(1)])
      ],
      deployer
    );

    // Check individual balances
    const balance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(balance1.result).toBeOk(Cl.uint(1000));

    const balance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(2)],
      address1
    );
    expect(balance2.result).toBeOk(Cl.uint(500));

    const balance3 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(3)],
      address1
    );
    expect(balance3.result).toBeOk(Cl.uint(1));
  });

  it("should handle zero amounts in batch mint", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3)]),
        Cl.list([Cl.uint(1000), Cl.uint(0), Cl.uint(1)]) // Zero amount for token 2
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check that token 2 has zero balance
    const balance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(2)],
      address1
    );
    expect(balance2.result).toBeOk(Cl.uint(0));
  });
});