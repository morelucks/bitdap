import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const marketplace = accounts.get("wallet_4")!;

const contractName = "bitdap-multi-token";

describe("Bitdap Multi Token - Token Freezing", () => {
  beforeEach(() => {
    // Create token for freezing tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Freeze Token"),
        Cl.stringUtf8("FREEZE"),
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

  it("should freeze token with reason", () => {
    const freezeReason = "Compliance investigation";

    const { result } = simnet.callPublicFn(
      contractName,
      "freeze-token",
      [Cl.uint(1), Cl.some(Cl.stringAscii(freezeReason))],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check token is frozen
    const frozenResult = simnet.callReadOnlyFn(
      contractName,
      "is-token-frozen",
      [Cl.uint(1)],
      deployer
    );
    expect(frozenResult.result).toBeOk(Cl.bool(true));
  });

  it("should unfreeze token successfully", () => {
    // Freeze first
    simnet.callPublicFn(
      contractName,
      "freeze-token",
      [Cl.uint(1), Cl.some(Cl.stringAscii("Test freeze"))],
      deployer
    );

    // Unfreeze
    const { result } = simnet.callPublicFn(
      contractName,
      "unfreeze-token",
      [Cl.uint(1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check token is unfrozen
    const frozenResult = simnet.callReadOnlyFn(
      contractName,
      "is-token-frozen",
      [Cl.uint(1)],
      deployer
    );
    expect(frozenResult.result).toBeOk(Cl.bool(false));
  });

  it("should reject freezing from unauthorized users", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "freeze-token",
      [Cl.uint(1), Cl.some(Cl.stringAscii("Unauthorized freeze"))],
      wallet1 // Not admin
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject freezing non-existent tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "freeze-token",
      [Cl.uint(999), Cl.some(Cl.stringAscii("Non-existent token"))],
      deployer
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-TOKEN-NOT-EXISTS
  });
});

describe("Bitdap Multi Token - Marketplace Integration", () => {
  beforeEach(() => {
    // Create token with royalties for marketplace tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Marketplace Token"),
        Cl.stringUtf8("MKT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/mkt")),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)), // royalty recipient
        Cl.uint(500) // 5% royalty
      ],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(10000)],
      deployer
    );
  });

  it("should approve marketplace with fee percentage", () => {
    const marketplaceFee = 250; // 2.5%

    const { result } = simnet.callPublicFn(
      contractName,
      "approve-marketplace",
      [Cl.principal(marketplace), Cl.uint(marketplaceFee)],
      wallet2
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should reject marketplace approval with excessive fees", () => {
    const excessiveFee = 1500; // 15% - above 10% max

    const { result } = simnet.callPublicFn(
      contractName,
      "approve-marketplace",
      [Cl.principal(marketplace), Cl.uint(excessiveFee)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(412)); // ERR-INVALID-ROYALTY
  });

  it("should calculate total fees correctly", () => {
    // Approve marketplace first
    simnet.callPublicFn(
      contractName,
      "approve-marketplace",
      [Cl.principal(marketplace), Cl.uint(250)], // 2.5% marketplace fee
      wallet2
    );

    const salePrice = 10000;
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "calculate-total-fees",
      [Cl.uint(1), Cl.principal(marketplace), Cl.uint(salePrice)],
      wallet2
    );

    expect(result).toBeOk(
      Cl.tuple({
        "royalty-fee": Cl.uint(500), // 5% of 10000
        "marketplace-fee": Cl.uint(250), // 2.5% of 10000
        "total-fees": Cl.uint(750), // 500 + 250
        "net-amount": Cl.uint(9250) // 10000 - 750
      })
    );
  });

  it("should handle marketplace fee calculation without approval", () => {
    const salePrice = 5000;
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "calculate-total-fees",
      [Cl.uint(1), Cl.principal(marketplace), Cl.uint(salePrice)],
      wallet2
    );

    expect(result).toBeOk(
      Cl.tuple({
        "royalty-fee": Cl.uint(250), // 5% of 5000
        "marketplace-fee": Cl.uint(0), // No marketplace approval
        "total-fees": Cl.uint(250), // 250 + 0
        "net-amount": Cl.uint(4750) // 5000 - 250
      })
    );
  });
});

describe("Bitdap Multi Token - Security Features", () => {
  beforeEach(() => {
    // Create token for security tests
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Security Token"),
        Cl.stringUtf8("SEC"),
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

  it("should log audit events for sensitive operations", () => {
    // Get initial operation ID
    const initialStatsResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-stats",
      [],
      deployer
    );
    const initialOpId = initialStatsResult.result.expectOk().expectTuple()["next-operation-id"];

    // Perform a transfer (should log audit event)
    simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1), Cl.uint(1000)],
      wallet1
    );

    // Check audit entry was created
    const auditResult = simnet.callReadOnlyFn(
      contractName,
      "get-audit-entry",
      [initialOpId],
      deployer
    );
    expect(auditResult.result).toBeOk(
      Cl.some(Cl.tuple({
        action: Cl.stringAscii("transfer"),
        actor: Cl.principal(wallet1),
        target: Cl.some(Cl.principal(wallet2)),
        "token-id": Cl.some(Cl.uint(1)),
        amount: Cl.some(Cl.uint(1000)),
        timestamp: Cl.uint(2),
        "block-height": Cl.uint(2)
      }))
    );
  });

  it("should handle conditional batch transfers", () => {
    // Mint tokens to multiple accounts first
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet2), Cl.uint(1), Cl.uint(3000)],
      deployer
    );

    const conditions = [
      {
        from: wallet1,
        to: wallet2,
        "token-id": 1,
        amount: 500,
        condition: "standard"
      },
      {
        from: wallet2,
        to: wallet3,
        "token-id": 1,
        amount: 300,
        condition: "verified"
      }
    ];

    const { result } = simnet.callPublicFn(
      contractName,
      "conditional-batch-transfer",
      [
        Cl.list(conditions.map(c => 
          Cl.tuple({
            from: Cl.principal(c.from),
            to: Cl.principal(c.to),
            "token-id": Cl.uint(c["token-id"]),
            amount: Cl.uint(c.amount),
            condition: Cl.stringAscii(c.condition)
          })
        ))
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify transfers occurred
    const wallet2Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );
    expect(wallet2Balance.result).toBeOk(Cl.uint(3200)); // 3000 + 500 - 300

    const wallet3Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet3), Cl.uint(1)],
      deployer
    );
    expect(wallet3Balance.result).toBeOk(Cl.uint(300));
  });

  it("should reject conditional transfers with invalid conditions", () => {
    const invalidConditions = [
      {
        from: wallet1,
        to: wallet1, // Self-transfer
        "token-id": 1,
        amount: 500,
        condition: "invalid"
      }
    ];

    const { result } = simnet.callPublicFn(
      contractName,
      "conditional-batch-transfer",
      [
        Cl.list(invalidConditions.map(c => 
          Cl.tuple({
            from: Cl.principal(c.from),
            to: Cl.principal(c.to),
            "token-id": Cl.uint(c["token-id"]),
            amount: Cl.uint(c.amount),
            condition: Cl.stringAscii(c.condition)
          })
        ))
      ],
      deployer
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED (self-transfer)
  });
});