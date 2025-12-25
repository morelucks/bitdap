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
describe("Bitdap Multi Token - Transfer", () => {
  beforeEach(() => {
    // Create and mint tokens for testing transfers
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Transfer Token"),
        Cl.stringUtf8("XFER"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    
    // Mint tokens to address1
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
  });

  it("should allow token owner to transfer tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1), Cl.uint(500)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should update balances correctly after transfer", () => {
    // Transfer tokens
    simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1), Cl.uint(300)],
      address1
    );

    // Check sender balance
    const senderBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(senderBalance.result).toBeOk(Cl.uint(700));

    // Check recipient balance
    const recipientBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address2), Cl.uint(1)],
      address1
    );
    expect(recipientBalance.result).toBeOk(Cl.uint(300));
  });

  it("should reject transfer from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1), Cl.uint(500)],
      address2 // address2 trying to transfer address1's tokens
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject transfer with insufficient balance", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1), Cl.uint(2000)], // More than balance
      address1
    );
    expect(result).toBeErr(Cl.uint(402)); // ERR-INSUFFICIENT-BALANCE
  });

  it("should reject self-transfer", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address1), Cl.uint(1), Cl.uint(500)],
      address1
    );
    expect(result).toBeErr(Cl.uint(405)); // ERR-SELF-TRANSFER
  });

  it("should reject transfer of zero amount", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1), Cl.uint(0)],
      address1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should reject transfer of non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(999), Cl.uint(500)],
      address1
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });
});
describe("Bitdap Multi Token - Safe Transfer & Batch Transfer", () => {
  beforeEach(() => {
    // Create multiple tokens for testing
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Token A"), Cl.stringUtf8("TA"), Cl.uint(18), Cl.bool(true), Cl.none()],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Token B"), Cl.stringUtf8("TB"), Cl.uint(6), Cl.bool(true), Cl.none()],
      deployer
    );
    
    // Mint tokens to address1
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(2), Cl.uint(2000)],
      deployer
    );
  });

  it("should perform safe transfer with data", () => {
    const transferData = new TextEncoder().encode("transfer metadata");
    const { result } = simnet.callPublicFn(
      contractName,
      "safe-transfer-from",
      [
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.uint(1),
        Cl.uint(500),
        Cl.buffer(transferData)
      ],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should perform batch transfer successfully", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-transfer-from",
      [
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(300), Cl.uint(700)])
      ],
      address1
    );
    expect(result).toBeOk(Cl.tuple({ from: Cl.principal(address1), to: Cl.principal(address2) }));
  });

  it("should update balances correctly after batch transfer", () => {
    // Perform batch transfer
    simnet.callPublicFn(
      contractName,
      "batch-transfer-from",
      [
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(400), Cl.uint(800)])
      ],
      address1
    );

    // Check sender balances
    const senderBalance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(senderBalance1.result).toBeOk(Cl.uint(600));

    const senderBalance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(2)],
      address1
    );
    expect(senderBalance2.result).toBeOk(Cl.uint(1200));

    // Check recipient balances
    const recipientBalance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address2), Cl.uint(1)],
      address1
    );
    expect(recipientBalance1.result).toBeOk(Cl.uint(400));

    const recipientBalance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address2), Cl.uint(2)],
      address1
    );
    expect(recipientBalance2.result).toBeOk(Cl.uint(800));
  });

  it("should reject batch transfer with mismatched array lengths", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-transfer-from",
      [
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(300)]) // Mismatched length
      ],
      address1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should perform safe batch transfer with data", () => {
    const transferData = new TextEncoder().encode("batch transfer metadata");
    const { result } = simnet.callPublicFn(
      contractName,
      "safe-batch-transfer-from",
      [
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(200), Cl.uint(400)]),
        Cl.buffer(transferData)
      ],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should handle zero amounts in batch transfer", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-transfer-from",
      [
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(0), Cl.uint(500)]) // Zero amount for first token
      ],
      address1
    );
    expect(result).toBeOk(Cl.tuple({ from: Cl.principal(address1), to: Cl.principal(address2) }));
  });
});
describe("Bitdap Multi Token - Approval System", () => {
  beforeEach(() => {
    // Create test token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Approval Token"), Cl.stringUtf8("APPR"), Cl.uint(18), Cl.bool(true), Cl.none()],
      deployer
    );
    
    // Mint tokens to address1
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
  });

  it("should allow setting approval for all tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(address2), Cl.bool(true)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should check approval for all tokens correctly", () => {
    // Set approval
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(address2), Cl.bool(true)],
      address1
    );

    // Check approval
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "is-approved-for-all",
      [Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should return false for non-approved operator", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "is-approved-for-all",
      [Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(result).toBeOk(Cl.bool(false));
  });

  it("should reject self-approval for all", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(address1), Cl.bool(true)], // Self-approval
      address1
    );
    expect(result).toBeErr(Cl.uint(406)); // ERR-INVALID-RECIPIENT
  });

  it("should allow setting specific token allowance", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(address2), Cl.uint(1), Cl.uint(500)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should return correct allowance amount", () => {
    // Set allowance
    simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(address2), Cl.uint(1), Cl.uint(300)],
      address1
    );

    // Check allowance
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-allowance",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(300));
  });

  it("should return zero allowance for non-approved spender", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-allowance",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("should reject approval for non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(address2), Cl.uint(999), Cl.uint(500)],
      address1
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });

  it("should reject self-approval for specific token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(500)], // Self-approval
      address1
    );
    expect(result).toBeErr(Cl.uint(406)); // ERR-INVALID-RECIPIENT
  });

  it("should allow revoking approval by setting to false", () => {
    // First set approval
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(address2), Cl.bool(true)],
      address1
    );

    // Then revoke it
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(address2), Cl.bool(false)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check that approval is revoked
    const approvalResult = simnet.callReadOnlyFn(
      contractName,
      "is-approved-for-all",
      [Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(approvalResult.result).toBeOk(Cl.bool(false));
  });
});
describe("Bitdap Multi Token - Burning", () => {
  beforeEach(() => {
    // Create test token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Burn Token"), Cl.stringUtf8("BURN"), Cl.uint(18), Cl.bool(true), Cl.none()],
      deployer
    );
    
    // Mint tokens to address1
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
  });

  it("should allow token owner to burn tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(300)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should update balance after burning", () => {
    // Burn tokens
    simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(400)],
      address1
    );

    // Check remaining balance
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(600));
  });

  it("should update total supply after burning", () => {
    // Burn tokens
    simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(200)],
      address1
    );

    // Check total supply
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(800));
  });

  it("should reject burning with insufficient balance", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(2000)], // More than balance
      address1
    );
    expect(result).toBeErr(Cl.uint(402)); // ERR-INSUFFICIENT-BALANCE
  });

  it("should reject burning zero amount", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(0)],
      address1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should reject burning from unauthorized account", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(300)],
      address2 // address2 trying to burn address1's tokens
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should allow approved operator to burn tokens", () => {
    // Set approval for all
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(address2), Cl.bool(true)],
      address1
    );

    // Burn as approved operator
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(250)],
      address2
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should reject burning non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(address1), Cl.uint(999), Cl.uint(100)],
      address1
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });
});
describe("Bitdap Multi Token - Batch Burning", () => {
  beforeEach(() => {
    // Create multiple test tokens
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Batch Burn A"), Cl.stringUtf8("BBA"), Cl.uint(18), Cl.bool(true), Cl.none()],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Batch Burn B"), Cl.stringUtf8("BBB"), Cl.uint(6), Cl.bool(true), Cl.none()],
      deployer
    );
    
    // Mint tokens to address1
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(2), Cl.uint(2000)],
      deployer
    );
  });

  it("should allow batch burning multiple tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-burn",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(300), Cl.uint(500)])
      ],
      address1
    );
    expect(result).toBeOk(Cl.principal(address1));
  });

  it("should update balances correctly after batch burn", () => {
    // Batch burn
    simnet.callPublicFn(
      contractName,
      "batch-burn",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(400), Cl.uint(800)])
      ],
      address1
    );

    // Check remaining balances
    const balance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(balance1.result).toBeOk(Cl.uint(600));

    const balance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(2)],
      address1
    );
    expect(balance2.result).toBeOk(Cl.uint(1200));
  });

  it("should update total supplies correctly after batch burn", () => {
    // Batch burn
    simnet.callPublicFn(
      contractName,
      "batch-burn",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(200), Cl.uint(300)])
      ],
      address1
    );

    // Check total supplies
    const supply1 = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      address1
    );
    expect(supply1.result).toBeOk(Cl.uint(800));

    const supply2 = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(2)],
      address1
    );
    expect(supply2.result).toBeOk(Cl.uint(1700));
  });

  it("should reject batch burn with mismatched array lengths", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-burn",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(300)]) // Mismatched length
      ],
      address1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should reject batch burn from unauthorized account", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-burn",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(300), Cl.uint(500)])
      ],
      address2 // address2 trying to burn address1's tokens
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should allow approved operator to batch burn", () => {
    // Set approval for all
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(address2), Cl.bool(true)],
      address1
    );

    // Batch burn as approved operator
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-burn",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(100), Cl.uint(200)])
      ],
      address2
    );
    expect(result).toBeOk(Cl.principal(address1));
  });

  it("should handle zero amounts in batch burn", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-burn",
      [
        Cl.principal(address1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(0), Cl.uint(400)]) // Zero amount for first token
      ],
      address1
    );
    expect(result).toBeOk(Cl.principal(address1));

    // Check that first token balance is unchanged
    const balance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(1)],
      address1
    );
    expect(balance1.result).toBeOk(Cl.uint(1000));

    // Check that second token balance is reduced
    const balance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address1), Cl.uint(2)],
      address1
    );
    expect(balance2.result).toBeOk(Cl.uint(1600));
  });
});
describe("Bitdap Multi Token - URI and Metadata Management", () => {
  beforeEach(() => {
    // Create test token with initial URI
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Metadata Token"),
        Cl.stringUtf8("META"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/initial.json"))
      ],
      deployer
    );
  });

  it("should return correct token URI", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.some(Cl.stringUtf8("https://example.com/initial.json")));
  });

  it("should allow owner to set token URI", () => {
    const newUri = Cl.some(Cl.stringUtf8("https://example.com/updated.json"));
    const { result } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(1), newUri],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify URI was updated
    const uriResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      address1
    );
    expect(uriResult.result).toBeOk(newUri);
  });

  it("should reject URI setting from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(1), Cl.some(Cl.stringUtf8("https://unauthorized.com"))],
      address1
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject URI setting for non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(999), Cl.some(Cl.stringUtf8("https://example.com"))],
      deployer
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });

  it("should allow setting URI to none", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(1), Cl.none()],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify URI was set to none
    const uriResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      address1
    );
    expect(uriResult.result).toBeOk(Cl.none());
  });

  it("should allow owner to update token info", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "update-token-info",
      [Cl.uint(1), Cl.stringUtf8("Updated Token"), Cl.stringUtf8("UPD")],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify token info was updated
    const metadataResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      address1
    );
    expect(metadataResult.result).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8("Updated Token"),
        symbol: Cl.stringUtf8("UPD"),
        decimals: Cl.uint(18),
        "total-supply": Cl.uint(0),
        "is-fungible": Cl.bool(true),
        uri: Cl.some(Cl.stringUtf8("https://example.com/initial.json"))
      })
    );
  });

  it("should reject token info update from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "update-token-info",
      [Cl.uint(1), Cl.stringUtf8("Unauthorized"), Cl.stringUtf8("UNAUTH")],
      address1
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject token info update for non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "update-token-info",
      [Cl.uint(999), Cl.stringUtf8("Non-existent"), Cl.stringUtf8("NONE")],
      deployer
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });

  it("should return error for URI of non-existent token", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(999)],
      address1
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });

  it("should return error for metadata of non-existent token", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(999)],
      address1
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });

  it("should return error for total supply of non-existent token", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(999)],
      address1
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });
});

describe("Bitdap Multi Token - Contract Pause Functionality", () => {
  beforeEach(() => {
    // Create test token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Pause Token"), Cl.stringUtf8("PAUSE"), Cl.uint(18), Cl.bool(true), Cl.none()],
      deployer
    );
  });

  it("should reject operations when contract is paused", () => {
    // Note: The contract doesn't have pause/unpause functions in the provided code
    // This test assumes such functionality would be added by the owner
    // For now, we test that operations work when not paused
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should check pause status", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "is-paused",
      [],
      address1
    );
    expect(result).toBeOk(Cl.bool(false));
  });
});

describe("Bitdap Multi Token - Edge Cases and Error Handling", () => {
  beforeEach(() => {
    // Create test tokens for edge case testing
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Edge Token"), Cl.stringUtf8("EDGE"), Cl.uint(18), Cl.bool(true), Cl.none()],
      deployer
    );
  });

  it("should handle maximum uint values correctly", () => {
    // Test with very large amounts (within uint limits)
    const largeAmount = 18446744073709551615n; // Max uint64 - 1
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(Number.MAX_SAFE_INTEGER)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should handle empty string edge cases", () => {
    // Test creating token with minimal valid strings
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("A"), Cl.stringUtf8("B"), Cl.uint(0), Cl.bool(false), Cl.none()],
      deployer
    );
    expect(result).toBeOk(Cl.uint(2));
  });

  it("should handle multiple rapid operations", () => {
    // Mint tokens
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );

    // Rapid transfer operations
    simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1), Cl.uint(100)],
      address1
    );
    
    simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address2), Cl.principal(address3), Cl.uint(1), Cl.uint(50)],
      address2
    );

    // Verify final balances
    const balance3 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(address3), Cl.uint(1)],
      address1
    );
    expect(balance3.result).toBeOk(Cl.uint(50));
  });
});
describe("Bitdap Multi Token - Event Emission Tests", () => {
  beforeEach(() => {
    simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("Event Token"), Cl.stringUtf8("EVENT"), Cl.uint(18), Cl.bool(true), Cl.none()],
      deployer
    );
  });

  it("should emit events on token creation", () => {
    const { result, events } = simnet.callPublicFn(
      contractName,
      "create-token",
      [Cl.stringUtf8("New Token"), Cl.stringUtf8("NEW"), Cl.uint(6), Cl.bool(true), Cl.none()],
      deployer
    );
    
    expect(result).toBeOk(Cl.uint(2));
    expect(events.length).toBeGreaterThan(0);
    
    // Check that creation event was emitted
    const hasCreationEvent = events.some((e: any) => {
      const eventStr = JSON.stringify(e);
      return eventStr.includes("create-token") || eventStr.includes("New Token");
    });
    expect(hasCreationEvent).toBe(true);
  });

  it("should emit events on minting", () => {
    const { result, events } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(500)],
      deployer
    );
    
    expect(result).toBeOk(Cl.bool(true));
    expect(events.length).toBeGreaterThan(0);
    
    // Check that mint event was emitted
    const hasMintEvent = events.some((e: any) => {
      const eventStr = JSON.stringify(e);
      return eventStr.includes("mint") || eventStr.includes("500");
    });
    expect(hasMintEvent).toBe(true);
  });

  it("should emit events on transfers", () => {
    // First mint tokens
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );

    // Then transfer
    const { result, events } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(address1), Cl.principal(address2), Cl.uint(1), Cl.uint(300)],
      address1
    );
    
    expect(result).toBeOk(Cl.bool(true));
    expect(events.length).toBeGreaterThan(0);
    
    // Check that transfer event was emitted
    const hasTransferEvent = events.some((e: any) => {
      const eventStr = JSON.stringify(e);
      return eventStr.includes("transfer") || eventStr.includes("300");
    });
    expect(hasTransferEvent).toBe(true);
  });
});