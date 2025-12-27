import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const contractName = "bitdap-multi-token";

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