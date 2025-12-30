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

// Enhanced role constants
const ROLE_ADMIN = 1;
const ROLE_MINTER = 2;
const ROLE_BURNER = 3;
const ROLE_METADATA_MANAGER = 4;

describe("Bitdap Multi Token - Enhanced Access Control", () => {
  it("should grant roles with metadata tracking", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet1), Cl.uint(ROLE_MINTER)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check role assignment with metadata
    const hasRoleResult = simnet.callReadOnlyFn(
      contractName,
      "has-role",
      [Cl.principal(wallet1), Cl.uint(ROLE_MINTER)],
      deployer
    );
    expect(hasRoleResult.result).toBeOk(Cl.bool(true));

    // Check user roles query
    const userRolesResult = simnet.callReadOnlyFn(
      contractName,
      "get-user-roles",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(userRolesResult.result).toBeOk(
      Cl.list([
        Cl.tuple({ role: Cl.uint(ROLE_ADMIN), assigned: Cl.bool(false) }),
        Cl.tuple({ role: Cl.uint(ROLE_MINTER), assigned: Cl.bool(true) }),
        Cl.tuple({ role: Cl.uint(ROLE_BURNER), assigned: Cl.bool(false) }),
        Cl.tuple({ role: Cl.uint(ROLE_METADATA_MANAGER), assigned: Cl.bool(false) })
      ])
    );
  });

  it("should support bulk role granting", () => {
    const users = [wallet1, wallet2, wallet3];
    const { result } = simnet.callPublicFn(
      contractName,
      "bulk-grant-roles",
      [
        Cl.list(users.map(user => Cl.principal(user))),
        Cl.uint(ROLE_MINTER)
      ],
      deployer
    );
    expect(result).toBeOk(Cl.uint(ROLE_MINTER));

    // Verify all users have the role
    users.forEach(user => {
      const hasRoleResult = simnet.callReadOnlyFn(
        contractName,
        "has-role",
        [Cl.principal(user), Cl.uint(ROLE_MINTER)],
        deployer
      );
      expect(hasRoleResult.result).toBeOk(Cl.bool(true));
    });
  });

  it("should support role inheritance", () => {
    // Grant admin role to wallet1
    simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet1), Cl.uint(ROLE_ADMIN)],
      deployer
    );

    // Admin should have inherited permissions
    const hasAdminResult = simnet.callReadOnlyFn(
      contractName,
      "has-role",
      [Cl.principal(wallet1), Cl.uint(ROLE_ADMIN)],
      deployer
    );
    expect(hasAdminResult.result).toBeOk(Cl.bool(true));

    // Admin should be able to grant roles to others
    const { result } = simnet.callPublicFn(
      contractName,
      "grant-role",
      [Cl.principal(wallet2), Cl.uint(ROLE_BURNER)],
      wallet1 // wallet1 as admin granting role
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});

describe("Bitdap Multi Token - Enhanced Royalty System", () => {
  it("should create tokens with enhanced royalty metadata", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Enhanced Royalty Token"),
        Cl.stringUtf8("ERT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.some(Cl.stringUtf8("https://example.com/ert")),
        Cl.some(Cl.uint(1000000)),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(750) // 7.5% royalty
      ],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1));

    // Check enhanced royalty info
    const royaltyResult = simnet.callReadOnlyFn(
      contractName,
      "get-royalty-info",
      [Cl.uint(1)],
      deployer
    );
    expect(royaltyResult.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(wallet1),
        percentage: Cl.uint(750),
        "created-by": Cl.principal(deployer),
        "created-at": Cl.uint(1),
        "last-updated": Cl.uint(1)
      })
    );
  });

  it("should update royalty information with authorization", () => {
    // Create token first
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Update Royalty Token"),
        Cl.stringUtf8("URT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(500)
      ],
      deployer
    );

    // Update royalty info
    const { result } = simnet.callPublicFn(
      contractName,
      "update-royalty-info",
      [Cl.uint(1), Cl.principal(wallet2), Cl.uint(300)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify update
    const royaltyResult = simnet.callReadOnlyFn(
      contractName,
      "get-royalty-info",
      [Cl.uint(1)],
      deployer
    );
    expect(royaltyResult.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(wallet2),
        percentage: Cl.uint(300),
        "created-by": Cl.principal(deployer),
        "created-at": Cl.uint(1),
        "last-updated": Cl.uint(2)
      })
    );
  });

  it("should reject royalty updates from unauthorized users", () => {
    // Create token
    simnet.callPublicFn(
      contractName,
      "create-token",
      [
        Cl.stringUtf8("Auth Test Token"),
        Cl.stringUtf8("ATT"),
        Cl.uint(18),
        Cl.bool(true),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.principal(wallet1)),
        Cl.uint(500)
      ],
      deployer
    );

    // Try to update from unauthorized user
    const { result } = simnet.callPublicFn(
      contractName,
      "update-royalty-info",
      [Cl.uint(1), Cl.principal(wallet3), Cl.uint(200)],
      wallet1 // unauthorized
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});

describe("Bitdap Multi Token - Enhanced Batch Querying", () => {
  beforeEach(() => {
    // Create multiple tokens for testing
    for (let i = 1; i <= 3; i++) {
      simnet.callPublicFn(
        contractName,
        "create-token",
        [
          Cl.stringUtf8(`Query Token ${i}`),
          Cl.stringUtf8(`QT${i}`),
          Cl.uint(18),
          Cl.bool(true),
          Cl.some(Cl.stringUtf8(`https://example.com/qt${i}`)),
          Cl.none(),
          Cl.none(),
          Cl.uint(0)
        ],
        deployer
      );
      
      // Mint some tokens
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.principal(wallet1), Cl.uint(i), Cl.uint(i * 1000)],
        deployer
      );
    }
  });

  it("should query multiple balances efficiently", () => {
    const accounts = [wallet1, wallet1, wallet1];
    const tokenIds = [1, 2, 3];

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-balance-batch",
      [
        Cl.list(accounts.map(acc => Cl.principal(acc))),
        Cl.list(tokenIds.map(id => Cl.uint(id)))
      ],
      deployer
    );

    expect(result).toBeOk(
      Cl.list([
        Cl.tuple({
          account: Cl.principal(wallet1),
          "token-id": Cl.uint(1),
          balance: Cl.uint(1000)
        }),
        Cl.tuple({
          account: Cl.principal(wallet1),
          "token-id": Cl.uint(2),
          balance: Cl.uint(2000)
        }),
        Cl.tuple({
          account: Cl.principal(wallet1),
          "token-id": Cl.uint(3),
          balance: Cl.uint(3000)
        })
      ])
    );
  });

  it("should check token existence in batch with details", () => {
    const tokenIds = [1, 2, 3, 999]; // Include non-existent token

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "tokens-exist-batch",
      [Cl.list(tokenIds.map(id => Cl.uint(id)))],
      deployer
    );

    expect(result).toBeOk(
      Cl.list([
        Cl.tuple({
          "token-id": Cl.uint(1),
          exists: Cl.bool(true),
          "total-supply": Cl.uint(1000)
        }),
        Cl.tuple({
          "token-id": Cl.uint(2),
          exists: Cl.bool(true),
          "total-supply": Cl.uint(2000)
        }),
        Cl.tuple({
          "token-id": Cl.uint(3),
          exists: Cl.bool(true),
          "total-supply": Cl.uint(3000)
        }),
        Cl.tuple({
          "token-id": Cl.uint(999),
          exists: Cl.bool(false),
          "total-supply": Cl.uint(0)
        })
      ])
    );
  });

  it("should query metadata in batch", () => {
    const tokenIds = [1, 2, 3];

    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-metadata-batch",
      [Cl.list(tokenIds.map(id => Cl.uint(id)))],
      deployer
    );

    expect(result).toBeOk(
      Cl.list([
        Cl.some(Cl.tuple({
          name: Cl.stringUtf8("Query Token 1"),
          symbol: Cl.stringUtf8("QT1"),
          decimals: Cl.uint(18),
          "total-supply": Cl.uint(1000),
          "max-supply": Cl.none(),
          "is-fungible": Cl.bool(true),
          uri: Cl.some(Cl.stringUtf8("https://example.com/qt1")),
          creator: Cl.principal(deployer)
        })),
        Cl.some(Cl.tuple({
          name: Cl.stringUtf8("Query Token 2"),
          symbol: Cl.stringUtf8("QT2"),
          decimals: Cl.uint(18),
          "total-supply": Cl.uint(2000),
          "max-supply": Cl.none(),
          "is-fungible": Cl.bool(true),
          uri: Cl.some(Cl.stringUtf8("https://example.com/qt2")),
          creator: Cl.principal(deployer)
        })),
        Cl.some(Cl.tuple({
          name: Cl.stringUtf8("Query Token 3"),
          symbol: Cl.stringUtf8("QT3"),
          decimals: Cl.uint(18),
          "total-supply": Cl.uint(3000),
          "max-supply": Cl.none(),
          "is-fungible": Cl.bool(true),
          uri: Cl.some(Cl.stringUtf8("https://example.com/qt3")),
          creator: Cl.principal(deployer)
        }))
      ])
    );
  });
});