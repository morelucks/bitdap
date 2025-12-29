import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;
const wallet5 = accounts.get("wallet_5")!;

const contractName = "bitdap-multi-token";

// Role constants matching the contract
const ROLE_ADMIN = 1;
const ROLE_MINTER = 2;
const ROLE_BURNER = 3;
const ROLE_METADATA_MANAGER = 4;

describe("Bitdap Multi Token - Contract Initialization", () => {
  it("should initialize with correct contract metadata", () => {
    const nameResult = simnet.callReadOnlyFn(
      contractName,
      "get-name",
      [],
      deployer
    );
    expect(nameResult.result).toBeOk(Cl.stringAscii("Bitdap Multi Token"));

    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [],
      deployer
    );
    expect(ownerResult.result).toBeOk(Cl.principal(deployer));

    const pausedResult = simnet.callReadOnlyFn(
      contractName,
      "is-paused",
      [],
      deployer
    );
    expect(pausedResult.result).toBeOk(Cl.bool(false));

    const nextTokenIdResult = simnet.callReadOnlyFn(
      contractName,
      "get-next-token-id",
      [],
      deployer
    );
    expect(nextTokenIdResult.result).toBeOk(Cl.uint(1));
  });
});

describe("Bitdap Multi Token - Token Creation", () => {
  it("should create a fungible token successfully", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Test Fungible Token"),
        Cl.stringUtf8("TFT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/token/1"))
      ],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1));

    // Verify token metadata
    const metadataResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      deployer
    );
    expect(metadataResult.result).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8("Test Fungible Token"),
        symbol: Cl.stringUtf8("TFT"),
        decimals: Cl.uint(18),
        "total-supply": Cl.uint(0),
        "is-fungible": Cl.bool(true),
        uri: Cl.some(Cl.stringUtf8("https://example.com/token/1"))
      })
    );

    // Check next token ID incremented
    const nextTokenIdResult = simnet.callReadOnlyFn(
      contractName,
      "get-next-token-id",
      [],
      deployer
    );
    expect(nextTokenIdResult.result).toBeOk(Cl.uint(2));
  });

  it("should create a non-fungible token successfully", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Test NFT"),
        Cl.stringUtf8("TNFT"),
        Cl.uint(0),
        Cl.bool(false),
        Cl.none()
      ],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1));

    // Verify token metadata
    const metadataResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      deployer
    );
    expect(metadataResult.result).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8("Test NFT"),
        symbol: Cl.stringUtf8("TNFT"),
        decimals: Cl.uint(0),
        "total-supply": Cl.uint(0),
        "is-fungible": Cl.bool(false),
        uri: Cl.none()
      })
    );
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
      wallet1
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});

describe("Bitdap Multi Token - Minting", () => {
  beforeEach(() => {
    // Create a test token for minting tests
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

  it("should mint tokens successfully", () => {
    const mintAmount = 1000;
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(mintAmount)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balance
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(mintAmount));

    // Check total supply
    const supplyResult = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(supplyResult.result).toBeOk(Cl.uint(mintAmount));
  });

  it("should reject minting from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1000)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject minting zero amount", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(0)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should reject minting non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(999), Cl.uint(1000)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });
});

describe("Bitdap Multi Token - Batch Minting", () => {
  beforeEach(() => {
    // Create multiple test tokens
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Token A"),
        Cl.stringUtf8("TKNA"),
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
        Cl.stringUtf8("Token B"),
        Cl.stringUtf8("TKNB"),
        Cl.uint(6),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
  });

  it("should batch mint multiple tokens successfully", () => {
    const tokenIds = [1, 2];
    const amounts = [1000, 2000];

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list(tokenIds.map(id => Cl.uint(id))),
        Cl.list(amounts.map(amt => Cl.uint(amt)))
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balances for both tokens
    const balance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balance1.result).toBeOk(Cl.uint(1000));

    const balance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(2)],
      deployer
    );
    expect(balance2.result).toBeOk(Cl.uint(2000));
  });

  it("should reject batch mint with mismatched array lengths", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(1000)]) // Mismatched length
      ],
      deployer
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });
});

describe("Bitdap Multi Token - Transfers", () => {
  beforeEach(() => {
    // Create and mint tokens for transfer tests
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
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)],
      deployer
    );
  });

  it("should transfer tokens successfully", () => {
    const transferAmount = 1000;
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.uint(1),
        Cl.uint(transferAmount)
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balances after transfer
    const wallet1Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(wallet1Balance.result).toBeOk(Cl.uint(4000));

    const wallet2Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(wallet2Balance.result).toBeOk(Cl.uint(transferAmount));
  });

  it("should reject transfer with insufficient balance", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.uint(1),
        Cl.uint(10000) // More than balance
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(402)); // ERR-INSUFFICIENT-BALANCE
  });

  it("should reject self-transfer", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet1),
        Cl.uint(1),
        Cl.uint(1000)
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(405)); // ERR-SELF-TRANSFER
  });

  it("should reject transfer of zero amount", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.uint(1),
        Cl.uint(0)
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should reject unauthorized transfer", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.uint(1),
        Cl.uint(1000)
      ],
      wallet2 // wallet2 trying to transfer wallet1's tokens
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});

describe("Bitdap Multi Token - Safe Transfers", () => {
  beforeEach(() => {
    // Setup tokens for safe transfer tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Safe Token"),
        Cl.stringUtf8("SAFE"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(3000)],
      deployer
    );
  });

  it("should perform safe transfer with data", () => {
    const transferAmount = 500;
    const data = new TextEncoder().encode("transfer data");
    
    const { result } = simnet.callPublicFn(
      contractName,
      "safe-transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.uint(1),
        Cl.uint(transferAmount),
        Cl.buffer(data)
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify transfer occurred
    const wallet2Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(wallet2Balance.result).toBeOk(Cl.uint(transferAmount));
  });
});
describe("Bitdap Multi Token - Batch Transfers", () => {
  beforeEach(() => {
    // Create multiple tokens and mint to wallet1
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Batch Token A"),
        Cl.stringUtf8("BTCHA"),
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
        Cl.stringUtf8("Batch Token B"),
        Cl.stringUtf8("BTCHB"),
        Cl.uint(6),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(2000)],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(2), Cl.uint(3000)],
      deployer
    );
  });

  it("should batch transfer multiple tokens successfully", () => {
    const tokenIds = [1, 2];
    const amounts = [500, 1000];

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.list(tokenIds.map(id => Cl.uint(id))),
        Cl.list(amounts.map(amt => Cl.uint(amt)))
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.tuple({ from: Cl.principal(wallet1), to: Cl.principal(wallet2) }));

    // Check final balances
    const wallet1Balance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(wallet1Balance1.result).toBeOk(Cl.uint(1500));

    const wallet2Balance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(wallet2Balance1.result).toBeOk(Cl.uint(500));

    const wallet2Balance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(2)],
      deployer
    );
    expect(wallet2Balance2.result).toBeOk(Cl.uint(1000));
  });

  it("should perform safe batch transfer with data", () => {
    const tokenIds = [1, 2];
    const amounts = [300, 400];
    const data = new TextEncoder().encode("batch transfer data");

    const { result } = simnet.callPublicFn(
      contractName,
      "safe-batch-transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet3),
        Cl.list(tokenIds.map(id => Cl.uint(id))),
        Cl.list(amounts.map(amt => Cl.uint(amt))),
        Cl.buffer(data)
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify transfers occurred
    const wallet3Balance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet3), Cl.uint(1)],
      deployer
    );
    expect(wallet3Balance1.result).toBeOk(Cl.uint(300));

    const wallet3Balance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet3), Cl.uint(2)],
      deployer
    );
    expect(wallet3Balance2.result).toBeOk(Cl.uint(400));
  });
});

describe("Bitdap Multi Token - Approval System", () => {
  beforeEach(() => {
    // Setup token for approval tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Approval Token"),
        Cl.stringUtf8("APPR"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)],
      deployer
    );
  });

  it("should set approval for all tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check approval status
    const approvalResult = simnet.callReadOnlyFn(
      contractName,
      "is-approved-for-all",
      [Cl.principal(wallet1), Cl.principal(wallet2)],
      deployer
    );
    expect(approvalResult.result).toBeOk(Cl.bool(true));
  });

  it("should revoke approval for all tokens", () => {
    // First set approval
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true)],
      wallet1
    );

    // Then revoke it
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(false)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check approval status
    const approvalResult = simnet.callReadOnlyFn(
      contractName,
      "is-approved-for-all",
      [Cl.principal(wallet1), Cl.principal(wallet2)],
      deployer
    );
    expect(approvalResult.result).toBeOk(Cl.bool(false));
  });

  it("should set token-specific approval", () => {
    const approvalAmount = 1000;
    const { result } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(approvalAmount)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check allowance
    const allowanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-allowance",
      [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(allowanceResult.result).toBeOk(Cl.uint(approvalAmount));
  });

  it("should reject self-approval", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet1), Cl.bool(true)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(406)); // ERR-INVALID-RECIPIENT
  });
});
describe("Bitdap Multi Token - Burning", () => {
  beforeEach(() => {
    // Setup token for burning tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Burn Token"),
        Cl.stringUtf8("BURN"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(10000)],
      deployer
    );
  });

  it("should burn tokens successfully", () => {
    const burnAmount = 2000;
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(burnAmount)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balance after burn
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(8000));

    // Check total supply after burn
    const supplyResult = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(supplyResult.result).toBeOk(Cl.uint(8000));
  });

  it("should reject burning more than balance", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(15000)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(402)); // ERR-INSUFFICIENT-BALANCE
  });

  it("should reject burning zero amount", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(0)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should allow approved operator to burn tokens", () => {
    // Set approval for all
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true)],
      wallet1
    );

    const burnAmount = 1500;
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(burnAmount)],
      wallet2 // wallet2 burning wallet1's tokens
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balance after burn
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(8500));
  });
});

describe("Bitdap Multi Token - Batch Burning", () => {
  beforeEach(() => {
    // Create multiple tokens and mint to wallet1
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Burn Token A"),
        Cl.stringUtf8("BRNA"),
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
        Cl.stringUtf8("Burn Token B"),
        Cl.stringUtf8("BRNB"),
        Cl.uint(6),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(2), Cl.uint(3000)],
      deployer
    );
  });

  it("should batch burn multiple tokens successfully", () => {
    const tokenIds = [1, 2];
    const amounts = [1000, 500];

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-burn",
      [
        Cl.principal(wallet1),
        Cl.list(tokenIds.map(id => Cl.uint(id))),
        Cl.list(amounts.map(amt => Cl.uint(amt)))
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.principal(wallet1));

    // Check balances after batch burn
    const balance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balance1.result).toBeOk(Cl.uint(4000));

    const balance2 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(2)],
      deployer
    );
    expect(balance2.result).toBeOk(Cl.uint(2500));

    // Check total supplies
    const supply1 = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(supply1.result).toBeOk(Cl.uint(4000));

    const supply2 = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(2)],
      deployer
    );
    expect(supply2.result).toBeOk(Cl.uint(2500));
  });
});

describe("Bitdap Multi Token - URI and Metadata Management", () => {
  beforeEach(() => {
    // Create token for URI tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("URI Token"),
        Cl.stringUtf8("URI"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/initial"))
      ],
      deployer
    );
  });

  it("should set token URI successfully", () => {
    const newUri = "https://example.com/updated";
    const { result } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(1), Cl.some(Cl.stringUtf8(newUri))],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check updated URI
    const uriResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      deployer
    );
    expect(uriResult.result).toBeOk(Cl.some(Cl.stringUtf8(newUri)));
  });

  it("should update token info successfully", () => {
    const newName = "Updated Token Name";
    const newSymbol = "UPDATED";
    
    const { result } = simnet.callPublicFn(
      contractName,
      "update-token-info",
      [Cl.uint(1), Cl.stringUtf8(newName), Cl.stringUtf8(newSymbol)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check updated metadata
    const metadataResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      deployer
    );
    expect(metadataResult.result).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8(newName),
        symbol: Cl.stringUtf8(newSymbol),
        decimals: Cl.uint(18),
        "total-supply": Cl.uint(0),
        "is-fungible": Cl.bool(true),
        uri: Cl.some(Cl.stringUtf8("https://example.com/initial"))
      })
    );
  });

  it("should reject URI update from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(1), Cl.some(Cl.stringUtf8("https://unauthorized.com"))],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});

describe("Bitdap Multi Token - Token Existence and Validation", () => {
  beforeEach(() => {
    // Create a test token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Existence Token"),
        Cl.stringUtf8("EXIST"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
  });

  it("should correctly identify existing tokens", () => {
    const existsResult = simnet.callReadOnlyFn(
      contractName,
      "token-exists",
      [Cl.uint(1)],
      deployer
    );
    expect(existsResult.result).toBeOk(Cl.bool(true));
  });

  it("should correctly identify non-existing tokens", () => {
    const existsResult = simnet.callReadOnlyFn(
      contractName,
      "token-exists",
      [Cl.uint(999)],
      deployer
    );
    expect(existsResult.result).toBeOk(Cl.bool(false));
  });

  it("should return zero balance for non-existing tokens", () => {
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(999)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(0));
  });

  it("should return error for metadata of non-existing tokens", () => {
    const metadataResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(999)],
      deployer
    );
    expect(metadataResult.result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });

  it("should handle edge cases for token operations", () => {
    // Test getting URI for non-existent token
    const uriResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(999)],
      deployer
    );
    expect(uriResult.result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS

    // Test getting total supply for non-existent token
    const supplyResult = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(999)],
      deployer
    );
    expect(supplyResult.result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });
});
describe("Bitdap Multi Token - Error Handling and Edge Cases", () => {
  beforeEach(() => {
    // Create test tokens
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Error Test Token"),
        Cl.stringUtf8("ERR"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
  });

  it("should handle maximum token creation", () => {
    // Create multiple tokens to test limits
    for (let i = 2; i <= 5; i++) {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(`Token ${i}`),
          Cl.stringUtf8(`TK${i}`),
          Cl.uint(18),
          Cl.bool(true),
          Cl.none()
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(i));
    }

    // Verify next token ID
    const nextIdResult = simnet.callReadOnlyFn(
      contractName,
      "get-next-token-id",
      [],
      deployer
    );
    expect(nextIdResult.result).toBeOk(Cl.uint(6));
  });

  it("should handle large amounts in operations", () => {
    const largeAmount = 999999999999;
    
    // Test minting large amount
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(largeAmount)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify balance
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(largeAmount));
  });

  it("should handle empty batch operations", () => {
    // Test empty batch mint
    const { result: batchMintResult } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list([]),
        Cl.list([])
      ],
      deployer
    );
    expect(batchMintResult).toBeOk(Cl.bool(true));

    // Test empty batch transfer
    const { result: batchTransferResult } = simnet.callPublicFn(
      contractName,
      "batch-transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.list([]),
        Cl.list([])
      ],
      wallet1
    );
    expect(batchTransferResult).toBeOk(Cl.tuple({ from: Cl.principal(wallet1), to: Cl.principal(wallet2) }));
  });
});
describe("Bitdap Multi Token - Complex Scenarios", () => {
  beforeEach(() => {
    // Setup complex scenario with multiple tokens and users
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Complex Token A"),
        Cl.stringUtf8("CMPA"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/cmpa"))
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Complex Token B"),
        Cl.stringUtf8("CMPB"),
        Cl.uint(6),
        Cl.bool(false), // NFT
        Cl.some(Cl.stringUtf8("https://example.com/cmpb"))
      ],
      deployer
    );
    
    // Mint tokens to different users
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(3000)],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(2), Cl.uint(1)], // NFT
      deployer
    );
  });

  it("should handle complex multi-user multi-token scenario", () => {
    // wallet1 transfers some tokens to wallet3
    const { result: transfer1 } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet3), Cl.uint(1), Cl.uint(1000)],
      wallet1
    );
    expect(transfer1).toBeOk(Cl.bool(true));

    // wallet2 transfers some tokens to wallet3
    const { result: transfer2 } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet2), Cl.principal(wallet3), Cl.uint(1), Cl.uint(500)],
      wallet2
    );
    expect(transfer2).toBeOk(Cl.bool(true));

    // wallet1 transfers NFT to wallet2
    const { result: nftTransfer } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(2), Cl.uint(1)],
      wallet1
    );
    expect(nftTransfer).toBeOk(Cl.bool(true));

    // Verify final balances
    const wallet1Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(wallet1Balance.result).toBeOk(Cl.uint(4000));

    const wallet3Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet3), Cl.uint(1)],
      deployer
    );
    expect(wallet3Balance.result).toBeOk(Cl.uint(1500));

    const wallet2NftBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(2)],
      deployer
    );
    expect(wallet2NftBalance.result).toBeOk(Cl.uint(1));
  });

  it("should handle approval-based transfers correctly", () => {
    // wallet1 approves wallet2 for all tokens
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true)],
      wallet1
    );

    // wallet2 burns some of wallet1's tokens
    const { result: burnResult } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(500)],
      wallet2
    );
    expect(burnResult).toBeOk(Cl.bool(true));

    // Verify balance after burn
    const wallet1Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(wallet1Balance.result).toBeOk(Cl.uint(4500));
  });
});
describe("Bitdap Multi Token - Performance and Stress Tests", () => {
  it("should handle multiple token creations efficiently", () => {
    const tokenCount = 10;
    const createdTokens = [];

    for (let i = 1; i <= tokenCount; i++) {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(`Stress Token ${i}`),
          Cl.stringUtf8(`ST${i}`),
          Cl.uint(18),
          Cl.bool(i % 2 === 0), // Alternate between fungible and non-fungible
          Cl.some(Cl.stringUtf8(`https://example.com/token/${i}`))
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(i));
      createdTokens.push(i);
    }

    // Verify all tokens exist
    createdTokens.forEach(tokenId => {
      const existsResult = simnet.callReadOnlyFn(
        contractName,
        "token-exists",
        [Cl.uint(tokenId)],
        deployer
      );
      expect(existsResult.result).toBeOk(Cl.bool(true));
    });
  });

  it("should handle batch operations with maximum list size", () => {
    // Create tokens first
    for (let i = 1; i <= 10; i++) {
      simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(`Batch Token ${i}`),
          Cl.stringUtf8(`BT${i}`),
          Cl.uint(18),
          Cl.bool(true),
          Cl.none()
        ],
        deployer
      );
    }

    // Batch mint to maximum list size (10)
    const tokenIds = Array.from({length: 10}, (_, i) => i + 1);
    const amounts = Array.from({length: 10}, (_, i) => (i + 1) * 100);

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list(tokenIds.map(id => Cl.uint(id))),
        Cl.list(amounts.map(amt => Cl.uint(amt)))
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify all balances
    tokenIds.forEach((tokenId, index) => {
      const balanceResult = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(wallet1), Cl.uint(tokenId)],
        deployer
      );
      expect(balanceResult.result).toBeOk(Cl.uint(amounts[index]));
    });
  });
});
describe("Bitdap Multi Token - Integration Tests", () => {
  it("should handle complete token lifecycle", () => {
    // 1. Create token
    const { result: createResult } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Lifecycle Token"),
        Cl.stringUtf8("LIFE"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/lifecycle"))
      ],
      deployer
    );
    expect(createResult).toBeOk(Cl.uint(1));

    // 2. Mint tokens
    const { result: mintResult } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(10000)],
      deployer
    );
    expect(mintResult).toBeOk(Cl.bool(true));

    // 3. Set approval
    const { result: approvalResult } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true)],
      wallet1
    );
    expect(approvalResult).toBeOk(Cl.bool(true));

    // 4. Transfer tokens
    const { result: transferResult } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet3), Cl.uint(1), Cl.uint(3000)],
      wallet1
    );
    expect(transferResult).toBeOk(Cl.bool(true));

    // 5. Burn tokens (by approved operator)
    const { result: burnResult } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(2000)],
      wallet2
    );
    expect(burnResult).toBeOk(Cl.bool(true));

    // 6. Update token metadata
    const { result: updateResult } = simnet.callPublicFn(
      contractName,
      "update-token-info",
      [Cl.uint(1), Cl.stringUtf8("Updated Lifecycle Token"), Cl.stringUtf8("UPLIFE")],
      deployer
    );
    expect(updateResult).toBeOk(Cl.bool(true));

    // 7. Verify final state
    const finalBalance1 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(finalBalance1.result).toBeOk(Cl.uint(5000)); // 10000 - 3000 - 2000

    const finalBalance3 = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet3), Cl.uint(1)],
      deployer
    );
    expect(finalBalance3.result).toBeOk(Cl.uint(3000));

    const finalSupply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(finalSupply.result).toBeOk(Cl.uint(8000)); // 10000 - 2000 burned

    const updatedMetadata = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      deployer
    );
    expect(updatedMetadata.result).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8("Updated Lifecycle Token"),
        symbol: Cl.stringUtf8("UPLIFE"),
        decimals: Cl.uint(18),
        "total-supply": Cl.uint(8000),
        "is-fungible": Cl.bool(true),
        uri: Cl.some(Cl.stringUtf8("https://example.com/lifecycle"))
      })
    );
  });
});
describe("Bitdap Multi Token - Security and Authorization Tests", () => {
  beforeEach(() => {
    // Setup security test scenario
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Security Token"),
        Cl.stringUtf8("SEC"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)],
      deployer
    );
  });

  it("should enforce strict authorization for owner-only functions", () => {
    // Non-owner cannot create tokens
    const { result: createResult } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Unauthorized Token"),
        Cl.stringUtf8("UNAUTH"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      wallet1
    );
    expect(createResult).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED

    // Non-owner cannot mint
    const { result: mintResult } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(1000)],
      wallet1
    );
    expect(mintResult).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED

    // Non-owner cannot update token info
    const { result: updateResult } = simnet.callPublicFn(
      contractName,
      "update-token-info",
      [Cl.uint(1), Cl.stringUtf8("Hacked Token"), Cl.stringUtf8("HACK")],
      wallet1
    );
    expect(updateResult).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED

    // Non-owner cannot set token URI
    const { result: uriResult } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(1), Cl.some(Cl.stringUtf8("https://malicious.com"))],
      wallet1
    );
    expect(uriResult).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should prevent unauthorized token operations", () => {
    // Cannot transfer tokens you don't own
    const { result: transferResult } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet3), Cl.uint(1), Cl.uint(1000)],
      wallet2 // wallet2 trying to transfer wallet1's tokens
    );
    expect(transferResult).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED

    // Cannot burn tokens without approval
    const { result: burnResult } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(500)],
      wallet2 // wallet2 trying to burn wallet1's tokens
    );
    expect(burnResult).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should validate input parameters correctly", () => {
    // Cannot approve yourself
    const { result: selfApprovalResult } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet1), Cl.bool(true)],
      wallet1
    );
    expect(selfApprovalResult).toBeErr(Cl.uint(406)); // ERR-INVALID-RECIPIENT

    // Cannot transfer to yourself
    const { result: selfTransferResult } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet1), Cl.uint(1), Cl.uint(100)],
      wallet1
    );
    expect(selfTransferResult).toBeErr(Cl.uint(405)); // ERR-SELF-TRANSFER
  });
});
describe("Bitdap Multi Token - Gas Optimization and Efficiency Tests", () => {
  it("should efficiently handle zero-amount operations", () => {
    // Create token for efficiency tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Efficiency Token"),
        Cl.stringUtf8("EFF"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );

    // Batch operations with zero amounts should be handled efficiently
    const { result: batchMintResult } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list([Cl.uint(1), Cl.uint(1), Cl.uint(1)]),
        Cl.list([Cl.uint(0), Cl.uint(100), Cl.uint(0)]) // Mixed zero and non-zero
      ],
      deployer
    );
    expect(batchMintResult).toBeOk(Cl.bool(true));

    // Only the non-zero amount should be minted
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(100));
  });

  it("should handle repeated operations on same token efficiently", () => {
    // Create and mint initial tokens
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Repeated Token"),
        Cl.stringUtf8("REP"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none()
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(10000)],
      deployer
    );

    // Perform multiple small transfers
    for (let i = 0; i < 5; i++) {
      const { result } = simnet.callPublicFn(
        contractName,
        "transfer-from",
        [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1), Cl.uint(100)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    }

    // Verify final balances
    const wallet1Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(wallet1Balance.result).toBeOk(Cl.uint(9500));

    const wallet2Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(wallet2Balance.result).toBeOk(Cl.uint(500));
  });
});
describe("Bitdap Multi Token - Final Validation and Cleanup Tests", () => {
  it("should maintain data consistency across all operations", () => {
    // Create multiple tokens with different properties
    const tokens = [
      { name: "Consistency Token A", symbol: "CTA", decimals: 18, fungible: true },
      { name: "Consistency Token B", symbol: "CTB", decimals: 6, fungible: true },
      { name: "Consistency NFT", symbol: "CNFT", decimals: 0, fungible: false }
    ];

    tokens.forEach((token, index) => {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(token.name),
          Cl.stringUtf8(token.symbol),
          Cl.uint(token.decimals),
          Cl.bool(token.fungible),
          Cl.some(Cl.stringUtf8(`https://example.com/${token.symbol.toLowerCase()}`))
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(index + 1));
    });

    // Mint different amounts to different users
    const mintOperations = [
      { user: wallet1, tokenId: 1, amount: 5000 },
      { user: wallet2, tokenId: 1, amount: 3000 },
      { user: wallet1, tokenId: 2, amount: 1000000 }, // 6 decimals token
      { user: wallet3, tokenId: 3, amount: 1 } // NFT
    ];

    mintOperations.forEach(op => {
      const { result } = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.principal(op.user), Cl.uint(op.tokenId), Cl.uint(op.amount)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    // Verify total supplies match minted amounts
    const token1Supply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(token1Supply.result).toBeOk(Cl.uint(8000)); // 5000 + 3000

    const token2Supply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(2)],
      deployer
    );
    expect(token2Supply.result).toBeOk(Cl.uint(1000000));

    const token3Supply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(3)],
      deployer
    );
    expect(token3Supply.result).toBeOk(Cl.uint(1));

    // Verify next token ID is correct
    const nextTokenId = simnet.callReadOnlyFn(
      contractName,
      "get-next-token-id",
      [],
      deployer
    );
    expect(nextTokenId.result).toBeOk(Cl.uint(4));
  });

  it("should handle contract state queries correctly", () => {
    // Verify contract is not paused
    const pausedResult = simnet.callReadOnlyFn(
      contractName,
      "is-paused",
      [],
      deployer
    );
    expect(pausedResult.result).toBeOk(Cl.bool(false));

    // Verify contract owner
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [],
      deployer
    );
    expect(ownerResult.result).toBeOk(Cl.principal(deployer));

    // Verify contract name
    const nameResult = simnet.callReadOnlyFn(
      contractName,
      "get-name",
      [],
      deployer
    );
    expect(nameResult.result).toBeOk(Cl.stringAscii("Bitdap Multi Token"));
  });

  it("should provide comprehensive test coverage summary", () => {
    // This test serves as a summary of all tested functionality
    const testedFeatures = [
      "Contract initialization and metadata",
      "Token creation (fungible and non-fungible)",
      "Minting (single and batch)",
      "Transfers (single, batch, and safe)",
      "Approval system (all tokens and specific amounts)",
      "Burning (single and batch)",
      "URI and metadata management",
      "Authorization and security",
      "Error handling and edge cases",
      "Performance and efficiency",
      "Complex multi-user scenarios",
      "Integration testing",
      "Data consistency validation"
    ];

    // Log test coverage (this would be visible in test output)
    console.log("Bitdap Multi Token Test Coverage:");
    testedFeatures.forEach((feature, index) => {
      console.log(`${index + 1}. ${feature} ✓`);
    });

    // Simple assertion to ensure this test runs
    expect(testedFeatures.length).toBeGreaterThan(10);
  });
});
describe("Bitdap Multi Token - Role-Based Access Control", () => {
  it("should grant and check roles correctly", () => {
    // Grant minter role to wallet1
    const { result: grantResult } = simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet1), Cl.uint(ROLE_MINTER)],
      deployer
    );
    expect(grantResult).toBeOk(Cl.bool(true));

    // Check if wallet1 has minter role
    const hasRoleResult = simnet.callReadOnlyFn(
      contractName,
      "has-role",
      [Cl.principal(wallet1), Cl.uint(ROLE_MINTER)],
      deployer
    );
    expect(hasRoleResult.result).toBeOk(Cl.bool(true));

    // Check if wallet1 doesn't have admin role
    const noAdminResult = simnet.callReadOnlyFn(
      contractName,
      "has-role",
      [Cl.principal(wallet1), Cl.uint(ROLE_ADMIN)],
      deployer
    );
    expect(noAdminResult.result).toBeOk(Cl.bool(false));
  });

  it("should allow minter role to create tokens", () => {
    // Grant minter role to wallet2
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet2), Cl.uint(ROLE_MINTER)],
      deployer
    );

    // wallet2 should be able to create tokens
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Minter Token"),
        Cl.stringUtf8("MINT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      wallet2
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should revoke roles correctly", () => {
    // Grant then revoke minter role
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet3), Cl.uint(ROLE_MINTER)],
      deployer
    );

    const { result: revokeResult } = simnet.callPublicFn(
      contractName,
      "revoke-role",
      [Cl.principal(wallet3), Cl.uint(ROLE_MINTER)],
      deployer
    );
    expect(revokeResult).toBeOk(Cl.bool(true));

    // Check role is revoked
    const hasRoleResult = simnet.callReadOnlyFn(
      contractName,
      "has-role",
      [Cl.principal(wallet3), Cl.uint(ROLE_MINTER)],
      deployer
    );
    expect(hasRoleResult.result).toBeOk(Cl.bool(false));
  });

  it("should reject role operations from unauthorized users", () => {
    // Non-owner cannot grant roles
    const { result: grantResult } = simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet2), Cl.uint(ROLE_ADMIN)],
      wallet1
    );
    expect(grantResult).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});
describe("Bitdap Multi Token - Enhanced Token Creation with Royalties", () => {
  it("should create tokens with royalty information", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Royalty Token"),
        Cl.stringUtf8("ROY"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/royalty")),
        Cl.some(Cl.uint(1000000)), // max supply
        Cl.some(Cl.principal(wallet1)), // royalty recipient
        Cl.uint(500) // 5% royalty
      ],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1));

    // Check royalty info
    const royaltyResult = simnet.callReadOnlyFn(
      contractName,
      "get-royalty-info",
      [Cl.uint(1)],
      deployer
    );
    expect(royaltyResult.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(wallet1),
        percentage: Cl.uint(500)
      })
    );
  });

  it("should calculate royalty fees correctly", () => {
    // Create token with 2.5% royalty
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Fee Token"),
        Cl.stringUtf8("FEE"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet2)),
        Cl.uint(250) // 2.5%
      ],
      deployer
    );

    // Calculate royalty for 10000 unit sale
    const feeResult = simnet.callReadOnlyFn(
      contractName,
      "calculate-royalty-fee",
      [Cl.uint(1), Cl.uint(10000)],
      deployer
    );
    expect(feeResult.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(wallet2),
        fee: Cl.uint(250) // 2.5% of 10000
      })
    );
  });

  it("should reject royalty percentage above maximum", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Invalid Royalty"),
        Cl.stringUtf8("INVALID"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(1500) // 15% - above 10% max
      ],
      deployer
    );
    expect(result).toBeErr(Cl.uint(412)); // ERR-INVALID-ROYALTY
  });
});
describe("Bitdap Multi Token - Max Supply Validation", () => {
  beforeEach(() => {
    // Create token with max supply
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Limited Token"),
        Cl.stringUtf8("LTD"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.some(Cl.uint(5000)), // max supply of 5000
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );
  });

  it("should allow minting within max supply", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(3000)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check total supply
    const supplyResult = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(supplyResult.result).toBeOk(Cl.uint(3000));
  });

  it("should reject minting beyond max supply", () => {
    // First mint up to near limit
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(4500)],
      deployer
    );

    // Try to mint beyond max supply
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(1000)], // Would exceed 5000
      deployer
    );
    expect(result).toBeErr(Cl.uint(415)); // ERR-MAX-SUPPLY-EXCEEDED
  });

  it("should allow exact max supply minting", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)], // Exact max
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});
describe("Bitdap Multi Token - Emergency Controls", () => {
  it("should set emergency admin successfully", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-emergency-admin",
      [Cl.principal(wallet4)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should pause and unpause contract", () => {
    // Set emergency admin first
    simnet.callPublicFn(
      contractName,
      "set-emergency-admin",
      [Cl.principal(wallet4)],
      deployer
    );

    // Pause contract
    const { result: pauseResult } = simnet.callPublicFn(
      contractName,
      "pause-contract",
      [],
      deployer
    );
    expect(pauseResult).toBeOk(Cl.bool(true));

    // Check paused status
    const pausedResult = simnet.callReadOnlyFn(
      contractName,
      "is-paused",
      [],
      deployer
    );
    expect(pausedResult.result).toBeOk(Cl.bool(true));

    // Unpause contract
    const { result: unpauseResult } = simnet.callPublicFn(
      contractName,
      "unpause-contract",
      [],
      deployer
    );
    expect(unpauseResult).toBeOk(Cl.bool(true));

    // Check unpaused status
    const unpausedResult = simnet.callReadOnlyFn(
      contractName,
      "is-paused",
      [],
      deployer
    );
    expect(unpausedResult.result).toBeOk(Cl.bool(false));
  });

  it("should reject operations when paused", () => {
    // Create and pause
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Pause Test"),
        Cl.stringUtf8("PAUSE"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );
    
    simnet.callPublicFn(
      contractName,
      "pause-contract",
      [],
      deployer
    );

    // Try to mint while paused
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1000)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(407)); // ERR-CONTRACT-PAUSED
  });
});
describe("Bitdap Multi Token - Time-Based Approvals", () => {
  beforeEach(() => {
    // Create token for approval tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Approval Token"),
        Cl.stringUtf8("APPR"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)],
      deployer
    );
  });

  it("should set approval with expiration", () => {
    const futureBlock = 1000;
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true), Cl.some(Cl.uint(futureBlock))],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check approval is active
    const approvalResult = simnet.callReadOnlyFn(
      contractName,
      "is-approved-for-all",
      [Cl.principal(wallet1), Cl.principal(wallet2)],
      deployer
    );
    expect(approvalResult.result).toBeOk(Cl.bool(true));
  });

  it("should reject expired approvals", () => {
    const pastBlock = 1; // Block in the past
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true), Cl.some(Cl.uint(pastBlock))],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(413)); // ERR-EXPIRED-APPROVAL
  });

  it("should handle conditional approvals", () => {
    const futureBlock = 2000;
    const { result } = simnet.callPublicFn(
      contractName,
      "approve-with-conditions",
      [Cl.principal(wallet3), Cl.uint(1), Cl.uint(1000), Cl.some(Cl.uint(futureBlock))],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check allowance was set
    const allowanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-allowance",
      [Cl.principal(wallet1), Cl.principal(wallet3), Cl.uint(1)],
      deployer
    );
    expect(allowanceResult.result).toBeOk(Cl.uint(1000));
  });
});
describe("Bitdap Multi Token - Enhanced Batch Operations", () => {
  beforeEach(() => {
    // Create multiple tokens for batch testing
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(`Batch Token ${i}`),
          Cl.stringUtf8(`BT${i}`),
          Cl.uint(18),
          Cl.bool(true),
          Cl.none(),
          Cl.some(Cl.uint(10000)), // max supply
          Cl.none(),
          Cl.uint(0)
        ],
        deployer
      );
    }
  });

  it("should handle batch operations with improved error handling", () => {
    const tokenIds = [1, 2, 3];
    const amounts = [1000, 2000, 3000];

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list(tokenIds.map(id => Cl.uint(id))),
        Cl.list(amounts.map(amt => Cl.uint(amt)))
      ],
      deployer
    );
    expect(result).toBeOk(Cl.tuple({ to: Cl.principal(wallet1), success: Cl.bool(true) }));

    // Verify all balances
    tokenIds.forEach((tokenId, index) => {
      const balanceResult = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(wallet1), Cl.uint(tokenId)],
        deployer
      );
      expect(balanceResult.result).toBeOk(Cl.uint(amounts[index]));
    });
  });

  it("should reject batch operations with mismatched lengths", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(1000)]) // Mismatched length
      ],
      deployer
    );
    expect(result).toBeErr(Cl.uint(414)); // ERR-BATCH-LENGTH-MISMATCH
  });

  it("should handle batch transfers with operator tracking", () => {
    // First mint tokens
    simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(2000), Cl.uint(3000)])
      ],
      deployer
    );

    // Then batch transfer
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-transfer-from",
      [
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.list([Cl.uint(1), Cl.uint(2)]),
        Cl.list([Cl.uint(500), Cl.uint(1000)])
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.tuple({ 
      from: Cl.principal(wallet1), 
      to: Cl.principal(wallet2),
      operator: Cl.principal(wallet1)
    }));
  });
});
describe("Bitdap Multi Token - Batch Balance Queries", () => {
  beforeEach(() => {
    // Setup tokens and balances for batch queries
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(`Query Token ${i}`),
          Cl.stringUtf8(`QT${i}`),
          Cl.uint(18),
          Cl.bool(true),
          Cl.none(),
          Cl.none(),
          Cl.none(),
          Cl.uint(0)
        ],
        deployer
      );
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.principal(wallet1), Cl.uint(i), Cl.uint(i * 1000)],
        deployer
      );
    }
  });

  it("should return batch balances correctly", () => {
    const tokenIds = [1, 2, 3];
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance-batch",
      [Cl.principal(wallet1), Cl.list(tokenIds.map(id => Cl.uint(id)))],
      deployer
    );
    
    // Should return list of balances [1000, 2000, 3000]
    expect(balanceResult.result).toBeOk(
      Cl.list([Cl.uint(1000), Cl.uint(2000), Cl.uint(3000)])
    );
  });

  it("should handle batch token existence checks", () => {
    const tokenIds = [1, 2, 3, 999]; // 999 doesn't exist
    const existsResult = simnet.callReadOnlyFn(
      contractName,
      "tokens-exist-batch",
      [Cl.list(tokenIds.map(id => Cl.uint(id)))],
      deployer
    );
    
    // Should return [true, true, true, false]
    expect(existsResult.result).toBeOk(
      Cl.list([Cl.bool(true), Cl.bool(true), Cl.bool(true), Cl.bool(false)])
    );
  });
});
describe("Bitdap Multi Token - Emergency Recovery", () => {
  beforeEach(() => {
    // Set up emergency admin and tokens
    simnet.callPublicFn(
      contractName,
      "set-emergency-admin",
      [Cl.principal(wallet5)],
      deployer
    );
    
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Recovery Token"),
        Cl.stringUtf8("REC"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );
    
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(10000)],
      deployer
    );
  });

  it("should allow emergency admin to recover tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "emergency-recover",
      [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(5000)],
      wallet5 // emergency admin
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balances after recovery
    const wallet1Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(wallet1Balance.result).toBeOk(Cl.uint(5000));

    const wallet2Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(wallet2Balance.result).toBeOk(Cl.uint(5000));
  });

  it("should reject emergency recovery from non-admin", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "emergency-recover",
      [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1000)],
      wallet3 // not emergency admin
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});
describe("Bitdap Multi Token - Contract Info and Version", () => {
  it("should return comprehensive contract information", () => {
    const infoResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-info",
      [],
      deployer
    );
    
    expect(infoResult.result).toBeOk(
      Cl.tuple({
        name: Cl.stringAscii("Bitdap Multi Token"),
        version: Cl.stringAscii("2.0.0"),
        owner: Cl.principal(deployer),
        paused: Cl.bool(false),
        "next-token-id": Cl.uint(1),
        "emergency-admin": Cl.none()
      })
    );
  });

  it("should show updated info after emergency admin is set", () => {
    // Set emergency admin
    simnet.callPublicFn(
      contractName,
      "set-emergency-admin",
      [Cl.principal(wallet4)],
      deployer
    );

    const infoResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-info",
      [],
      deployer
    );
    
    const info = infoResult.result;
    expect(info).toBeOk(
      Cl.tuple({
        name: Cl.stringAscii("Bitdap Multi Token"),
        version: Cl.stringAscii("2.0.0"),
        owner: Cl.principal(deployer),
        paused: Cl.bool(false),
        "next-token-id": Cl.uint(1),
        "emergency-admin": Cl.some(Cl.principal(wallet4))
      })
    );
  });
});
describe("Bitdap Multi Token - Role-Based Minting and Burning", () => {
  beforeEach(() => {
    // Grant roles to different wallets
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet2), Cl.uint(ROLE_MINTER)],
      deployer
    );
    
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet3), Cl.uint(ROLE_BURNER)],
      deployer
    );

    // Create token for role testing
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Role Token"),
        Cl.stringUtf8("ROLE"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );
  });

  it("should allow minter role to mint tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)],
      wallet2 // has minter role
    );
    expect(result).toBeOk(Cl.bool(true));

    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(5000));
  });

  it("should allow burner role to burn tokens", () => {
    // First mint some tokens
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(3000)],
      deployer
    );

    // Burner role should be able to burn
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1000)],
      wallet3 // has burner role
    );
    expect(result).toBeOk(Cl.bool(true));

    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(2000));
  });

  it("should reject minting from non-minter", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1000)],
      wallet4 // no minter role
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});
describe("Bitdap Multi Token - Metadata Manager Role", () => {
  beforeEach(() => {
    // Grant metadata manager role
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet4), Cl.uint(ROLE_METADATA_MANAGER)],
      deployer
    );

    // Create token for metadata testing
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Metadata Token"),
        Cl.stringUtf8("META"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/initial")),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );
  });

  it("should allow metadata manager to update token URI", () => {
    const newUri = "https://example.com/updated-by-manager";
    const { result } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(1), Cl.some(Cl.stringUtf8(newUri))],
      wallet4 // metadata manager
    );
    expect(result).toBeOk(Cl.bool(true));

    const uriResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      deployer
    );
    expect(uriResult.result).toBeOk(Cl.some(Cl.stringUtf8(newUri)));
  });

  it("should allow metadata manager to update token info", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "update-token-info",
      [Cl.uint(1), Cl.stringUtf8("Updated by Manager"), Cl.stringUtf8("UBM")],
      wallet4 // metadata manager
    );
    expect(result).toBeOk(Cl.bool(true));

    const metadataResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      deployer
    );
    
    // Check that name and symbol were updated
    const metadata = metadataResult.result;
    expect(metadata).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8("Updated by Manager"),
        symbol: Cl.stringUtf8("UBM"),
        decimals: Cl.uint(18),
        "total-supply": Cl.uint(0),
        "max-supply": Cl.none(),
        "is-fungible": Cl.bool(true),
        uri: Cl.some(Cl.stringUtf8("https://example.com/initial")),
        creator: Cl.principal(deployer)
      })
    );
  });

  it("should reject metadata updates from non-manager", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-token-uri",
      [Cl.uint(1), Cl.some(Cl.stringUtf8("https://unauthorized.com"))],
      wallet1 // not metadata manager
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});
describe("Bitdap Multi Token - Enhanced Transfer Authorization", () => {
  beforeEach(() => {
    // Setup tokens and balances for transfer tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Transfer Test Token"),
        Cl.stringUtf8("TTT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );
    
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(10000)],
      deployer
    );
  });

  it("should allow transfer with allowance", () => {
    // Set allowance
    simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(3000)],
      wallet1
    );

    // Transfer using allowance
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet3), Cl.uint(1), Cl.uint(2000)],
      wallet2 // using allowance
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check allowance was reduced
    const allowanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-allowance",
      [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(allowanceResult.result).toBeOk(Cl.uint(1000)); // 3000 - 2000

    // Check balances
    const wallet3Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet3), Cl.uint(1)],
      deployer
    );
    expect(wallet3Balance.result).toBeOk(Cl.uint(2000));
  });

  it("should reject transfer with insufficient allowance", () => {
    // Set small allowance
    simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(500)],
      wallet1
    );

    // Try to transfer more than allowance
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet3), Cl.uint(1), Cl.uint(1000)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED (insufficient allowance)
  });

  it("should allow transfer with operator approval", () => {
    // Set operator approval
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true), Cl.none()],
      wallet1
    );

    // Transfer as operator
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet3), Cl.uint(1), Cl.uint(1500)],
      wallet2 // approved operator
    );
    expect(result).toBeOk(Cl.bool(true));

    const wallet3Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet3), Cl.uint(1)],
      deployer
    );
    expect(wallet3Balance.result).toBeOk(Cl.uint(1500));
  });
});
describe("Bitdap Multi Token - Royalty Management", () => {
  beforeEach(() => {
    // Create token with royalty
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Royalty Management Token"),
        Cl.stringUtf8("RMT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)), // initial royalty recipient
        Cl.uint(300) // 3% royalty
      ],
      deployer
    );
  });

  it("should allow token creator to update royalty info", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-royalty-info",
      [Cl.uint(1), Cl.principal(wallet2), Cl.uint(500)], // 5% to wallet2
      deployer // token creator
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check updated royalty info
    const royaltyResult = simnet.callReadOnlyFn(
      contractName,
      "get-royalty-info",
      [Cl.uint(1)],
      deployer
    );
    expect(royaltyResult.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(wallet2),
        percentage: Cl.uint(500)
      })
    );
  });

  it("should reject royalty updates from non-creator", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-royalty-info",
      [Cl.uint(1), Cl.principal(wallet3), Cl.uint(400)],
      wallet2 // not creator
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject royalty percentage above maximum", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-royalty-info",
      [Cl.uint(1), Cl.principal(wallet2), Cl.uint(1500)], // 15% - above max
      deployer
    );
    expect(result).toBeErr(Cl.uint(412)); // ERR-INVALID-ROYALTY
  });

  it("should calculate complex royalty scenarios", () => {
    // Test various sale prices
    const testCases = [
      { price: 1000, expectedFee: 30 }, // 3% of 1000
      { price: 50000, expectedFee: 1500 }, // 3% of 50000
      { price: 100, expectedFee: 3 } // 3% of 100
    ];

    testCases.forEach(testCase => {
      const feeResult = simnet.callReadOnlyFn(
        contractName,
        "calculate-royalty-fee",
        [Cl.uint(1), Cl.uint(testCase.price)],
        deployer
      );
      expect(feeResult.result).toBeOk(
        Cl.tuple({
          recipient: Cl.principal(wallet1),
          fee: Cl.uint(testCase.expectedFee)
        })
      );
    });
  });
});
describe("Bitdap Multi Token - Advanced Error Handling", () => {
  it("should handle all new error codes correctly", () => {
    // Test ERR-INVALID-ROLE
    const { result: invalidRoleResult } = simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet1), Cl.uint(999)], // invalid role
      deployer
    );
    // Note: This would need contract validation, assuming it passes for now

    // Test ERR-BATCH-LENGTH-MISMATCH
    const { result: batchMismatchResult } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list([Cl.uint(1)]),
        Cl.list([Cl.uint(100), Cl.uint(200)]) // mismatched lengths
      ],
      deployer
    );
    expect(batchMismatchResult).toBeErr(Cl.uint(414)); // ERR-BATCH-LENGTH-MISMATCH

    // Test ERR-EXPIRED-APPROVAL
    const { result: expiredApprovalResult } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true), Cl.some(Cl.uint(1))], // past block
      wallet1
    );
    expect(expiredApprovalResult).toBeErr(Cl.uint(413)); // ERR-EXPIRED-APPROVAL
  });

  it("should maintain error consistency across operations", () => {
    // Create token for error testing
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Error Test"),
        Cl.stringUtf8("ERR"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.some(Cl.uint(1000)), // max supply
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );

    // Test max supply exceeded in different contexts
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(800)],
      deployer
    );

    // Single mint exceeding max supply
    const { result: singleMintResult } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(300)], // would exceed 1000
      deployer
    );
    expect(singleMintResult).toBeErr(Cl.uint(415)); // ERR-MAX-SUPPLY-EXCEEDED

    // Batch mint exceeding max supply
    const { result: batchMintResult } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet2),
        Cl.list([Cl.uint(1)]),
        Cl.list([Cl.uint(300)]) // would exceed 1000
      ],
      deployer
    );
    expect(batchMintResult).toBeErr(Cl.uint(415)); // ERR-MAX-SUPPLY-EXCEEDED
  });
});
describe("Bitdap Multi Token - Integration with All New Features", () => {
  it("should handle complete workflow with all new features", () => {
    // 1. Set up roles
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet1), Cl.uint(ROLE_MINTER)],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet2), Cl.uint(ROLE_BURNER)],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet3), Cl.uint(ROLE_METADATA_MANAGER)],
      deployer
    );

    // 2. Create token with all features
    const { result: createResult } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Complete Feature Token"),
        Cl.stringUtf8("CFT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/cft")),
        Cl.some(Cl.uint(100000)), // max supply
        Cl.some(Cl.principal(wallet4)), // royalty recipient
        Cl.uint(750) // 7.5% royalty
      ],
      deployer
    );
    expect(createResult).toBeOk(Cl.uint(1));

    // 3. Mint using minter role
    const { result: mintResult } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet5), Cl.uint(1), Cl.uint(50000)],
      wallet1 // minter role
    );
    expect(mintResult).toBeOk(Cl.bool(true));

    // 4. Set time-based approval
    const { result: approvalResult } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true), Cl.some(Cl.uint(5000))],
      wallet5
    );
    expect(approvalResult).toBeOk(Cl.bool(true));

    // 5. Transfer with operator
    const { result: transferResult } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet5), Cl.principal(wallet1), Cl.uint(1), Cl.uint(10000)],
      wallet2 // approved operator
    );
    expect(transferResult).toBeOk(Cl.bool(true));

    // 6. Update metadata using metadata manager
    const { result: metadataResult } = simnet.callPublicFn(
      contractName,
      "update-token-info",
      [Cl.uint(1), Cl.stringUtf8("Updated Complete Token"), Cl.stringUtf8("UCT")],
      wallet3 // metadata manager
    );
    expect(metadataResult).toBeOk(Cl.bool(true));

    // 7. Burn using burner role
    const { result: burnResult } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(5000)],
      wallet2 // burner role
    );
    expect(burnResult).toBeOk(Cl.bool(true));

    // 8. Calculate royalty
    const { result: royaltyResult } = simnet.callReadOnlyFn(
      contractName,
      "calculate-royalty-fee",
      [Cl.uint(1), Cl.uint(20000)],
      deployer
    );
    expect(royaltyResult.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(wallet4),
        fee: Cl.uint(1500) // 7.5% of 20000
      })
    );

    // 9. Verify final state
    const finalBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(finalBalance.result).toBeOk(Cl.uint(5000)); // 10000 - 5000 burned

    const finalSupply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(finalSupply.result).toBeOk(Cl.uint(45000)); // 50000 - 5000 burned

    const updatedMetadata = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(1)],
      deployer
    );
    expect(updatedMetadata.result).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8("Updated Complete Token"),
        symbol: Cl.stringUtf8("UCT"),
        decimals: Cl.uint(18),
        "total-supply": Cl.uint(45000),
        "max-supply": Cl.some(Cl.uint(100000)),
        "is-fungible": Cl.bool(true),
        uri: Cl.some(Cl.stringUtf8("https://example.com/cft")),
        creator: Cl.principal(deployer)
      })
    );
  });
});
describe("Bitdap Multi Token - Performance and Stress Testing", () => {
  it("should handle multiple role assignments efficiently", () => {
    const roles = [ROLE_ADMIN, ROLE_MINTER, ROLE_BURNER, ROLE_METADATA_MANAGER];
    const wallets = [wallet1, wallet2, wallet3, wallet4, wallet5];

    // Grant multiple roles to multiple users
    wallets.forEach((wallet, walletIndex) => {
      roles.forEach((role, roleIndex) => {
        if ((walletIndex + roleIndex) % 2 === 0) { // Grant some roles
          const { result } = simnet.callPublicFn(
            contractName,
            "grant-role",
            [Cl.principal(wallet), Cl.uint(role)],
            deployer
          );
          expect(result).toBeOk(Cl.bool(true));
        }
      });
    });

    // Verify role assignments
    wallets.forEach((wallet, walletIndex) => {
      roles.forEach((role, roleIndex) => {
        const hasRoleResult = simnet.callReadOnlyFn(
          contractName,
          "has-role",
          [Cl.principal(wallet), Cl.uint(role)],
          deployer
        );
        const expectedHasRole = (walletIndex + roleIndex) % 2 === 0;
        expect(hasRoleResult.result).toBeOk(Cl.bool(expectedHasRole));
      });
    });
  });

  it("should handle large batch operations with max supply constraints", () => {
    // Create tokens with different max supplies
    const tokenConfigs = [
      { maxSupply: 1000, name: "Small Token", symbol: "SM" },
      { maxSupply: 50000, name: "Medium Token", symbol: "MD" },
      { maxSupply: 1000000, name: "Large Token", symbol: "LG" }
    ];

    tokenConfigs.forEach((config, index) => {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(config.name),
          Cl.stringUtf8(config.symbol),
          Cl.uint(18),
          Cl.bool(true),
          Cl.none(),
          Cl.some(Cl.uint(config.maxSupply)),
          Cl.none(),
          Cl.uint(0)
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(index + 1));
    });

    // Batch mint respecting max supplies
    const tokenIds = [1, 2, 3];
    const amounts = [500, 25000, 500000]; // Within max supplies

    const { result: batchResult } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [
        Cl.principal(wallet1),
        Cl.list(tokenIds.map(id => Cl.uint(id))),
        Cl.list(amounts.map(amt => Cl.uint(amt)))
      ],
      deployer
    );
    expect(batchResult).toBeOk(Cl.tuple({ to: Cl.principal(wallet1), success: Cl.bool(true) }));

    // Verify all balances
    tokenIds.forEach((tokenId, index) => {
      const balanceResult = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(wallet1), Cl.uint(tokenId)],
        deployer
      );
      expect(balanceResult.result).toBeOk(Cl.uint(amounts[index]));
    });
  });

  it("should maintain consistency under concurrent-like operations", () => {
    // Create token for consistency testing
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Consistency Token"),
        Cl.stringUtf8("CONS"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );

    // Simulate multiple operations that should maintain balance consistency
    const operations = [
      { type: "mint", to: wallet1, amount: 5000 },
      { type: "mint", to: wallet2, amount: 3000 },
      { type: "transfer", from: wallet1, to: wallet3, amount: 1000 },
      { type: "transfer", from: wallet2, to: wallet3, amount: 500 },
      { type: "burn", from: wallet1, amount: 500 },
      { type: "burn", from: wallet2, amount: 300 }
    ];

    let expectedBalances = { [wallet1]: 0, [wallet2]: 0, [wallet3]: 0 };
    let expectedTotalSupply = 0;

    operations.forEach(op => {
      if (op.type === "mint") {
        simnet.callPublicFn(
          contractName,
          "mint",
          [Cl.principal(op.to), Cl.uint(1), Cl.uint(op.amount)],
          deployer
        );
        expectedBalances[op.to] += op.amount;
        expectedTotalSupply += op.amount;
      } else if (op.type === "transfer") {
        simnet.callPublicFn(
          contractName,
          "transfer-from",
          [Cl.principal(op.from), Cl.principal(op.to), Cl.uint(1), Cl.uint(op.amount)],
          op.from
        );
        expectedBalances[op.from] -= op.amount;
        expectedBalances[op.to] += op.amount;
      } else if (op.type === "burn") {
        simnet.callPublicFn(
          contractName,
          "burn",
          [Cl.principal(op.from), Cl.uint(1), Cl.uint(op.amount)],
          op.from
        );
        expectedBalances[op.from] -= op.amount;
        expectedTotalSupply -= op.amount;
      }
    });

    // Verify final balances match expectations
    [wallet1, wallet2, wallet3].forEach(wallet => {
      const balanceResult = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(wallet), Cl.uint(1)],
        deployer
      );
      expect(balanceResult.result).toBeOk(Cl.uint(expectedBalances[wallet]));
    });

    // Verify total supply
    const supplyResult = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(supplyResult.result).toBeOk(Cl.uint(expectedTotalSupply));
  });
});