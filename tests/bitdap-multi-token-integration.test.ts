import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;

const contractName = "bitdap-multi-token";

describe("Bitdap Multi Token - Integration Utilities", () => {
  beforeEach(() => {
    // Create multiple tokens for integration testing
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(`Integration Token ${i}`),
          Cl.stringUtf8(`INT${i}`),
          Cl.uint(18),
          Cl.bool(true),
          Cl.some(Cl.stringUtf8(`https://example.com/int${i}`)),
          Cl.none(),
          Cl.some(Cl.principal(wallet1)),
          Cl.uint(i * 100) // Different royalty percentages
        ],
        deployer
      );
      
      // Mint tokens
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.principal(wallet1), Cl.uint(i), Cl.uint(i * 1000)],
        deployer
      );
    }
  });

  it("should provide comprehensive contract statistics", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-contract-stats",
      [],
      deployer
    );

    expect(result).toBeOk(
      Cl.tuple({
        "total-tokens": Cl.uint(4), // 3 created + next ID
        "contract-paused": Cl.bool(false),
        "pause-level": Cl.uint(0),
        "emergency-admin": Cl.none(),
        "next-operation-id": Cl.uint(1),
        "reentrancy-guard": Cl.bool(false)
      })
    );
  });

  it("should query batch token information with details", () => {
    const tokenIds = [1, 2, 3];

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-tokens-info-batch",
      [Cl.list(tokenIds.map(id => Cl.uint(id)))],
      deployer
    );

    expect(result).toBeOk(
      Cl.list([
        Cl.some(Cl.tuple({
          metadata: Cl.tuple({
            name: Cl.stringUtf8("Integration Token 1"),
            symbol: Cl.stringUtf8("INT1"),
            decimals: Cl.uint(18),
            "total-supply": Cl.uint(1000),
            "max-supply": Cl.none(),
            "is-fungible": Cl.bool(true),
            uri: Cl.some(Cl.stringUtf8("https://example.com/int1")),
            creator: Cl.principal(deployer)
          }),
          royalty: Cl.some(Cl.tuple({
            recipient: Cl.principal(wallet1),
            percentage: Cl.uint(100),
            "created-by": Cl.principal(deployer),
            "created-at": Cl.uint(1),
            "last-updated": Cl.uint(1)
          })),
          frozen: Cl.bool(false)
        })),
        Cl.some(Cl.tuple({
          metadata: Cl.tuple({
            name: Cl.stringUtf8("Integration Token 2"),
            symbol: Cl.stringUtf8("INT2"),
            decimals: Cl.uint(18),
            "total-supply": Cl.uint(2000),
            "max-supply": Cl.none(),
            "is-fungible": Cl.bool(true),
            uri: Cl.some(Cl.stringUtf8("https://example.com/int2")),
            creator: Cl.principal(deployer)
          }),
          royalty: Cl.some(Cl.tuple({
            recipient: Cl.principal(wallet1),
            percentage: Cl.uint(200),
            "created-by": Cl.principal(deployer),
            "created-at": Cl.uint(2),
            "last-updated": Cl.uint(2)
          })),
          frozen: Cl.bool(false)
        })),
        Cl.some(Cl.tuple({
          metadata: Cl.tuple({
            name: Cl.stringUtf8("Integration Token 3"),
            symbol: Cl.stringUtf8("INT3"),
            decimals: Cl.uint(18),
            "total-supply": Cl.uint(3000),
            "max-supply": Cl.none(),
            "is-fungible": Cl.bool(true),
            uri: Cl.some(Cl.stringUtf8("https://example.com/int3")),
            creator: Cl.principal(deployer)
          }),
          royalty: Cl.some(Cl.tuple({
            recipient: Cl.principal(wallet1),
            percentage: Cl.uint(300),
            "created-by": Cl.principal(deployer),
            "created-at": Cl.uint(3),
            "last-updated": Cl.uint(3)
          })),
          frozen: Cl.bool(false)
        }))
      ])
    );
  });

  it("should support token data migration", () => {
    // Create source token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Source Token"),
        Cl.stringUtf8("SRC"),
        Cl.uint(6),
        Cl.bool(false), // NFT
        Cl.some(Cl.stringUtf8("https://example.com/src")),
        Cl.some(Cl.uint(1)),
        Cl.some(Cl.principal(wallet2)),
        Cl.uint(750)
      ],
      deployer
    );

    const sourceTokenId = 4;
    const targetTokenId = 10;

    // Migrate token data
    const { result } = simnet.callPublicFn(
      contractName,
      "migrate-token-data",
      [Cl.uint(sourceTokenId), Cl.uint(targetTokenId)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify migration
    const migratedMetadata = simnet.callReadOnlyFn(
      contractName,
      "get-token-metadata",
      [Cl.uint(targetTokenId)],
      deployer
    );
    expect(migratedMetadata.result).toBeOk(
      Cl.tuple({
        name: Cl.stringUtf8("Source Token"),
        symbol: Cl.stringUtf8("SRC"),
        decimals: Cl.uint(6),
        "total-supply": Cl.uint(0),
        "max-supply": Cl.some(Cl.uint(1)),
        "is-fungible": Cl.bool(false),
        uri: Cl.some(Cl.stringUtf8("https://example.com/src")),
        creator: Cl.principal(deployer)
      })
    );

    // Verify royalty migration
    const migratedRoyalty = simnet.callReadOnlyFn(
      contractName,
      "get-royalty-info",
      [Cl.uint(targetTokenId)],
      deployer
    );
    expect(migratedRoyalty.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(wallet2),
        percentage: Cl.uint(750),
        "created-by": Cl.principal(deployer),
        "created-at": Cl.uint(4),
        "last-updated": Cl.uint(4)
      })
    );
  });

  it("should reject migration from unauthorized users", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "migrate-token-data",
      [Cl.uint(1), Cl.uint(20)],
      wallet1 // Not owner
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject migration of non-existent source token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "migrate-token-data",
      [Cl.uint(999), Cl.uint(30)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });
});

describe("Bitdap Multi Token - Legacy Compatibility", () => {
  beforeEach(() => {
    // Create token for compatibility testing
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Legacy Token"),
        Cl.stringUtf8("LEGACY"),
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

  it("should support legacy balance queries", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "legacy-get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(5000));
  });

  it("should support legacy total supply queries", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "legacy-get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(5000));
  });

  it("should provide enhanced contract information", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-enhanced-contract-info",
      [],
      deployer
    );

    expect(result).toBeOk(
      Cl.tuple({
        name: Cl.stringAscii("Bitdap Multi Token"),
        version: Cl.stringAscii("3.0.0-enhanced"),
        owner: Cl.principal(deployer),
        paused: Cl.bool(false),
        "pause-level": Cl.uint(0),
        "pause-reason": Cl.none(),
        "next-token-id": Cl.uint(2),
        "emergency-admin": Cl.none(),
        features: Cl.list([
          Cl.stringAscii("role-based-access"),
          Cl.stringAscii("royalties"),
          Cl.stringAscii("batch-operations"),
          Cl.stringAscii("emergency-controls"),
          Cl.stringAscii("audit-trail"),
          Cl.stringAscii("marketplace-integration"),
          Cl.stringAscii("token-freezing")
        ]),
        "total-operations": Cl.uint(1)
      })
    );
  });
});

describe("Bitdap Multi Token - Performance and Stress Testing", () => {
  it("should handle maximum batch operations efficiently", () => {
    // Create maximum number of tokens for batch operations
    const maxTokens = 10;
    for (let i = 1; i <= maxTokens; i++) {
      simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(`Stress Token ${i}`),
          Cl.stringUtf8(`ST${i}`),
          Cl.uint(18),
          Cl.bool(true),
          Cl.none(),
          Cl.none(),
          Cl.none(),
          Cl.uint(0)
        ],
        deployer
      );
    }

    // Batch mint maximum tokens
    const tokenIds = Array.from({length: maxTokens}, (_, i) => i + 1);
    const amounts = Array.from({length: maxTokens}, (_, i) => (i + 1) * 100);

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint-atomic",
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

  it("should handle complex multi-user scenarios", () => {
    // Create tokens
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Complex Token"),
        Cl.stringUtf8("COMPLEX"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(500)
      ],
      deployer
    );

    // Mint to multiple users
    const users = [wallet1, wallet2, wallet3, wallet4];
    users.forEach((user, index) => {
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.principal(user), Cl.uint(1), Cl.uint((index + 1) * 1000)],
        deployer
      );
    });

    // Set up complex approval chain
    simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(wallet2), Cl.bool(true), Cl.none(), Cl.none()],
      wallet1
    );

    simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(wallet3), Cl.uint(1), Cl.uint(500), Cl.none(), Cl.none()],
      wallet2
    );

    // Execute complex transfer chain
    const { result: transfer1 } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet4), Cl.uint(1), Cl.uint(300)],
      wallet2 // Using approval
    );
    expect(transfer1).toBeOk(Cl.bool(true));

    const { result: transfer2 } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(1), Cl.uint(500)],
      wallet3 // Using allowance
    );
    expect(transfer2).toBeOk(Cl.bool(true));

    // Verify final balances
    const wallet1Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(wallet1Balance.result).toBeOk(Cl.uint(1200)); // 1000 - 300 + 500

    const wallet4Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet4), Cl.uint(1)],
      deployer
    );
    expect(wallet4Balance.result).toBeOk(Cl.uint(4300)); // 4000 + 300
  });

  it("should maintain data consistency under stress", () => {
    // Create token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Consistency Token"),
        Cl.stringUtf8("CONSIST"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.some(Cl.uint(100000)), // Max supply
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );

    // Perform multiple operations
    const operations = [
      { user: wallet1, amount: 10000 },
      { user: wallet2, amount: 15000 },
      { user: wallet3, amount: 20000 },
      { user: wallet4, amount: 25000 }
    ];

    let totalMinted = 0;
    operations.forEach(op => {
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.principal(op.user), Cl.uint(1), Cl.uint(op.amount)],
        deployer
      );
      totalMinted += op.amount;
    });

    // Verify total supply consistency
    const totalSupplyResult = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [Cl.uint(1)],
      deployer
    );
    expect(totalSupplyResult.result).toBeOk(Cl.uint(totalMinted));

    // Verify individual balances sum to total
    let balanceSum = 0;
    operations.forEach(op => {
      const balanceResult = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(op.user), Cl.uint(1)],
        deployer
      );
      balanceSum += balanceResult.result.expectOk().expectUint();
    });

    expect(balanceSum).toBe(totalMinted);
  });
});