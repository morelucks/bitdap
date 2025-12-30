import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const contractName = "bitdap-multi-token";

describe("Bitdap Multi Token - Edge Cases and Error Handling", () => {
  it("should handle maximum royalty percentage edge case", () => {
    // Test exactly at maximum (10%)
    const { result: maxRoyalty } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Max Royalty Token"),
        Cl.stringUtf8("MAX"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(1000) // Exactly 10%
      ],
      deployer
    );
    expect(maxRoyalty).toBeOk(Cl.uint(1));

    // Test above maximum (should fail)
    const { result: overMaxRoyalty } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Over Max Royalty Token"),
        Cl.stringUtf8("OVER"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(1001) // Over 10%
      ],
      deployer
    );
    expect(overMaxRoyalty).toBeErr(Cl.uint(412)); // ERR-INVALID-ROYALTY
  });

  it("should handle zero and minimum amounts correctly", () => {
    // Create token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Zero Test Token"),
        Cl.stringUtf8("ZERO"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );

    // Test zero amount mint (should fail)
    const { result: zeroMint } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(0)],
      deployer
    );
    expect(zeroMint).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT

    // Test minimum amount mint (should succeed)
    const { result: minMint } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1)],
      deployer
    );
    expect(minMint).toBeOk(Cl.bool(true));
  });

  it("should handle max supply edge cases", () => {
    // Create token with max supply of 1
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Single Token"),
        Cl.stringUtf8("SINGLE"),
        Cl.uint(0),
        Cl.bool(false), // NFT
        Cl.none(),
        Cl.some(Cl.uint(1)), // Max supply 1
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );

    // Mint exactly max supply (should succeed)
    const { result: exactMint } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1)],
      deployer
    );
    expect(exactMint).toBeOk(Cl.bool(true));

    // Try to mint beyond max supply (should fail)
    const { result: overMint } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(1)],
      deployer
    );
    expect(overMint).toBeErr(Cl.uint(415)); // ERR-MAX-SUPPLY-EXCEEDED
  });

  it("should handle empty batch operations gracefully", () => {
    // Empty batch mint
    const { result: emptyBatchMint } = simnet.callPublicFn(
      contractName,
      "batch-mint-atomic",
      [
        Cl.principal(wallet1),
        Cl.list([]),
        Cl.list([])
      ],
      deployer
    );
    expect(emptyBatchMint).toBeOk(Cl.tuple({ to: Cl.principal(wallet1), success: Cl.bool(true) }));

    // Empty batch transfer
    const { result: emptyBatchTransfer } = simnet.callPublicFn(
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
    expect(emptyBatchTransfer).toBeOk(
      Cl.tuple({
        from: Cl.principal(wallet1),
        to: Cl.principal(wallet2),
        operator: Cl.principal(wallet1)
      })
    );
  });

  it("should handle large numbers without overflow", () => {
    // Create token with very large max supply
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Large Token"),
        Cl.stringUtf8("LARGE"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.some(Cl.uint(999999999999)), // Very large max supply
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );

    // Mint large amount
    const largeAmount = 999999999;
    const { result: largeMint } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(1), Cl.uint(largeAmount)],
      deployer
    );
    expect(largeMint).toBeOk(Cl.bool(true));

    // Verify balance
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(largeAmount));
  });

  it("should handle non-existent token operations gracefully", () => {
    const nonExistentTokenId = 999;

    // Test various operations on non-existent token
    const operations = [
      () => simnet.callPublicFn(contractName, "mint", [Cl.principal(wallet1), Cl.uint(nonExistentTokenId), Cl.uint(1000)], deployer),
      () => simnet.callReadOnlyFn(contractName, "get-token-metadata", [Cl.uint(nonExistentTokenId)], deployer),
      () => simnet.callReadOnlyFn(contractName, "get-token-uri", [Cl.uint(nonExistentTokenId)], deployer),
      () => simnet.callReadOnlyFn(contractName, "get-total-supply", [Cl.uint(nonExistentTokenId)], deployer),
      () => simnet.callPublicFn(contractName, "freeze-token", [Cl.uint(nonExistentTokenId), Cl.some(Cl.stringAscii("test"))], deployer)
    ];

    operations.forEach(operation => {
      const result = operation();
      expect(result.result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
    });

    // Balance query should return 0 for non-existent token (not error)
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1), Cl.uint(nonExistentTokenId)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(0));
  });

  it("should handle complex approval expiration scenarios", () => {
    // Create token and mint
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Expiry Test Token"),
        Cl.stringUtf8("EXPIRY"),
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

    // Test approval with past expiration (should fail)
    const { result: pastExpiry } = simnet.callPublicFn(
      contractName,
      "approve",
      [
        Cl.principal(wallet2),
        Cl.uint(1),
        Cl.uint(1000),
        Cl.some(Cl.uint(1)), // Past block
        Cl.none()
      ],
      wallet1
    );
    expect(pastExpiry).toBeErr(Cl.uint(413)); // ERR-EXPIRED-APPROVAL

    // Test approval with future expiration (should succeed)
    const { result: futureExpiry } = simnet.callPublicFn(
      contractName,
      "approve",
      [
        Cl.principal(wallet2),
        Cl.uint(1),
        Cl.uint(1000),
        Cl.some(Cl.uint(1000)), // Future block
        Cl.some(Cl.stringAscii("test-condition"))
      ],
      wallet1
    );
    expect(futureExpiry).toBeOk(Cl.bool(true));

    // Verify enhanced allowance details
    const allowanceDetails = simnet.callReadOnlyFn(
      contractName,
      "get-allowance-details",
      [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(allowanceDetails.result).toBeOk(
      Cl.tuple({
        allowance: Cl.uint(1000),
        "expires-at": Cl.some(Cl.uint(1000)),
        conditions: Cl.some(Cl.stringAscii("test-condition"))
      })
    );
  });

  it("should handle marketplace fee edge cases", () => {
    // Create token with royalty
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Marketplace Token"),
        Cl.stringUtf8("MKT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(500) // 5% royalty
      ],
      deployer
    );

    // Test maximum marketplace fee (10%)
    const { result: maxFee } = simnet.callPublicFn(
      contractName,
      "approve-marketplace",
      [Cl.principal(wallet3), Cl.uint(1000)], // Exactly 10%
      wallet1
    );
    expect(maxFee).toBeOk(Cl.bool(true));

    // Test over maximum marketplace fee (should fail)
    const { result: overMaxFee } = simnet.callPublicFn(
      contractName,
      "approve-marketplace",
      [Cl.principal(wallet3), Cl.uint(1001)], // Over 10%
      wallet2
    );
    expect(overMaxFee).toBeErr(Cl.uint(412)); // ERR-INVALID-ROYALTY

    // Test fee calculation with maximum fees
    const { result: maxFeeCalc } = simnet.callReadOnlyFn(
      contractName,
      "calculate-total-fees",
      [Cl.uint(1), Cl.principal(wallet3), Cl.uint(10000)],
      wallet1
    );
    expect(maxFeeCalc).toBeOk(
      Cl.tuple({
        "royalty-fee": Cl.uint(500), // 5% of 10000
        "marketplace-fee": Cl.uint(1000), // 10% of 10000
        "total-fees": Cl.uint(1500), // 500 + 1000
        "net-amount": Cl.uint(8500) // 10000 - 1500
      })
    );
  });

  it("should handle pause level edge cases", () => {
    // Test valid pause levels
    const validLevels = [0, 1, 2];
    validLevels.forEach(level => {
      const { result } = simnet.callPublicFn(
        contractName,
        "pause-contract",
        [Cl.uint(level), Cl.some(Cl.stringAscii(`Level ${level} pause`))],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Unpause for next test
      simnet.callPublicFn(contractName, "unpause-contract", [], deployer);
    });

    // Test invalid pause level
    const { result: invalidLevel } = simnet.callPublicFn(
      contractName,
      "pause-contract",
      [Cl.uint(5), Cl.none()], // Invalid level
      deployer
    );
    expect(invalidLevel).toBeErr(Cl.uint(404)); // ERR-INVALID-AMOUNT
  });

  it("should handle token migration edge cases", () => {
    // Create source token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Migration Source"),
        Cl.stringUtf8("MSRC"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/msrc")),
        Cl.some(Cl.uint(10000)),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(750)
      ],
      deployer
    );

    // Test migration to same token ID (should fail)
    const { result: sameMigration } = simnet.callPublicFn(
      contractName,
      "migrate-token-data",
      [Cl.uint(1), Cl.uint(1)], // Same source and target
      deployer
    );
    expect(sameMigration).toBeErr(Cl.uint(403)); // ERR-INVALID-TOKEN-ID

    // Test successful migration
    const { result: successMigration } = simnet.callPublicFn(
      contractName,
      "migrate-token-data",
      [Cl.uint(1), Cl.uint(10)],
      deployer
    );
    expect(successMigration).toBeOk(Cl.bool(true));

    // Test migration to already existing target (should fail)
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Existing Target"),
        Cl.stringUtf8("EXIST"),
        Cl.uint(6),
        Cl.bool(false),
        Cl.none(),
        Cl.none(),
        Cl.none(),
        Cl.uint(0)
      ],
      deployer
    );

    const { result: existingTarget } = simnet.callPublicFn(
      contractName,
      "migrate-token-data",
      [Cl.uint(1), Cl.uint(2)], // Target already exists
      deployer
    );
    expect(existingTarget).toBeErr(Cl.uint(403)); // ERR-INVALID-TOKEN-ID
  });
});