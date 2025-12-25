import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

// Global declarations for Clarinet SDK
declare const simnet: any;
declare const TextEncoder: any;

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
describe("Bitdap NFT Collection - Approval System", () => {
  beforeEach(() => {
    // Mint NFT for approval tests
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.some(Cl.stringUtf8("https://example.com/nft/1.json"))],
      deployer
    );
  });

  it("should allow owner to approve another address for specific token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.uint(1), Cl.principal(address2)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check approval
    const approvalResult = simnet.callReadOnlyFn(
      contractName,
      "get-approved",
      [Cl.uint(1)],
      address1
    );
    expect(approvalResult.result).toBeOk(Cl.some(Cl.principal(address2)));
  });

  it("should allow setting approval for all tokens", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-approval-for-all",
      [Cl.principal(address2), Cl.bool(true)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check approval for all
    const approvalResult = simnet.callReadOnlyFn(
      contractName,
      "is-approved-for-all-query",
      [Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(approvalResult.result).toBeOk(Cl.bool(true));
  });

  it("should allow approved address to transfer token", () => {
    // Approve address2
    simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.uint(1), Cl.principal(address2)],
      address1
    );

    // Transfer from approved address
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address3)],
      address2
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify transfer
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(ownerResult.result).toBeOk(Cl.some(Cl.principal(address3)));
  });

  it("should clear approval after transfer", () => {
    // Approve address2
    simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.uint(1), Cl.principal(address2)],
      address1
    );

    // Transfer from approved address
    simnet.callPublicFn(
      contractName,
      "transfer-from",
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address3)],
      address2
    );

    // Check approval is cleared
    const approvalResult = simnet.callReadOnlyFn(
      contractName,
      "get-approved",
      [Cl.uint(1)],
      address1
    );
    expect(approvalResult.result).toBeOk(Cl.none());
  });

  it("should reject approval from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.uint(1), Cl.principal(address3)],
      address2 // Non-owner
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject self-approval", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.uint(1), Cl.principal(address1)],
      address1 // Self-approval
    );
    expect(result).toBeErr(Cl.uint(407)); // ERR-SELF-TRANSFER
  });

  it("should reject approval for non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.uint(999), Cl.principal(address2)],
      address1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-NOT-FOUND
  });
});
describe("Bitdap NFT Collection - Burning Functionality", () => {
  beforeEach(() => {
    // Mint NFT for burning tests
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.some(Cl.stringUtf8("https://example.com/nft/1.json"))],
      deployer
    );
  });

  it("should allow owner to burn NFT", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify token no longer exists
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(ownerResult.result).toBeOk(Cl.none());
  });

  it("should decrease total supply after burning", () => {
    // Check initial supply
    const initialSupply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      address1
    );
    expect(initialSupply.result).toBeOk(Cl.uint(1));

    // Burn NFT
    simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );

    // Check supply decreased
    const finalSupply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      address1
    );
    expect(finalSupply.result).toBeOk(Cl.uint(0));
  });

  it("should reject burning from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address2 // Non-owner
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject burning non-existent token", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(999)],
      address1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR-NOT-FOUND
  });

  it("should reject burning when contract is paused", () => {
    // Pause contract
    simnet.callPublicFn(
      contractName,
      "pause-contract",
      [],
      deployer
    );

    // Try to burn
    const { result } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeErr(Cl.uint(406)); // ERR-CONTRACT-PAUSED
  });

  it("should remove token metadata after burning", () => {
    // Burn NFT
    simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );

    // Check metadata is removed
    const uriResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(1)],
      address1
    );
    expect(uriResult.result).toBeOk(Cl.none());
  });

  it("should confirm token no longer exists after burning", () => {
    // Burn NFT
    simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(1)],
      address1
    );

    // Check token existence
    const existsResult = simnet.callReadOnlyFn(
      contractName,
      "token-exists?",
      [Cl.uint(1)],
      address1
    );
    expect(existsResult.result).toBeBool(false);
  });
});
describe("Bitdap NFT Collection - Administrative Functions", () => {
  it("should allow owner to set collection metadata", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-collection-metadata",
      [
        Cl.stringAscii("New Collection Name"),
        Cl.stringAscii("NCN"),
        Cl.some(Cl.stringUtf8("https://newcollection.com")),
        Cl.stringUtf8("Updated collection description")
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify metadata updated
    const nameResult = simnet.callReadOnlyFn(
      contractName,
      "get-collection-name",
      [],
      address1
    );
    expect(nameResult.result).toBeOk(Cl.stringAscii("New Collection Name"));
  });

  it("should allow owner to set mint price", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-mint-price",
      [Cl.uint(1000000)], // 1 STX
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify mint info updated
    const mintInfoResult = simnet.callReadOnlyFn(
      contractName,
      "get-mint-info",
      [],
      address1
    );
    expect(mintInfoResult.result).toBeOk(
      Cl.tuple({
        price: Cl.uint(1000000),
        "per-address-limit": Cl.uint(10),
        "max-supply": Cl.uint(10000),
        "current-supply": Cl.uint(0),
        "minting-enabled": Cl.bool(true)
      })
    );
  });

  it("should allow owner to set per-address limit", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-per-address-limit",
      [Cl.uint(5)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should allow owner to set max supply", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-max-supply",
      [Cl.uint(5000)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should allow owner to pause and unpause contract", () => {
    // Pause
    const pauseResult = simnet.callPublicFn(
      contractName,
      "pause-contract",
      [],
      deployer
    );
    expect(pauseResult.result).toBeOk(Cl.bool(true));

    // Check status
    const statusResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-status",
      [],
      address1
    );
    expect(statusResult.result).toBeOk(
      Cl.tuple({
        paused: Cl.bool(true),
        "minting-enabled": Cl.bool(true),
        owner: Cl.principal(deployer)
      })
    );

    // Unpause
    const unpauseResult = simnet.callPublicFn(
      contractName,
      "unpause-contract",
      [],
      deployer
    );
    expect(unpauseResult.result).toBeOk(Cl.bool(true));
  });

  it("should allow owner to toggle minting enabled", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-minting-enabled",
      [Cl.bool(false)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check status
    const statusResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-status",
      [],
      address1
    );
    expect(statusResult.result).toBeOk(
      Cl.tuple({
        paused: Cl.bool(false),
        "minting-enabled": Cl.bool(false),
        owner: Cl.principal(deployer)
      })
    );
  });

  it("should reject admin functions from non-owner", () => {
    const adminFunctions = [
      {
        fn: "set-collection-metadata",
        args: [
          Cl.stringAscii("Hack"),
          Cl.stringAscii("HACK"),
          Cl.none(),
          Cl.stringUtf8("Hacked")
        ]
      },
      {
        fn: "set-mint-price",
        args: [Cl.uint(0)]
      },
      {
        fn: "pause-contract",
        args: []
      },
      {
        fn: "set-minting-enabled",
        args: [Cl.bool(false)]
      }
    ];

    adminFunctions.forEach(test => {
      const { result } = simnet.callPublicFn(
        contractName,
        test.fn,
        test.args,
        address1 // Non-owner
      );
      expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
    });
  });

  it("should allow owner to transfer ownership", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "transfer-ownership",
      [Cl.principal(address1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify new owner
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-owner",
      [],
      address1
    );
    expect(ownerResult.result).toBeOk(Cl.principal(address1));
  });
});
describe("Bitdap NFT Collection - Batch Operations", () => {
  beforeEach(() => {
    // Mint some NFTs for batch operations
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.some(Cl.stringUtf8("https://example.com/nft/1.json"))],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.some(Cl.stringUtf8("https://example.com/nft/2.json"))],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.some(Cl.stringUtf8("https://example.com/nft/3.json"))],
      deployer
    );
  });

  it("should allow batch minting by owner", () => {
    const recipients = [
      {
        recipient: Cl.principal(address2),
        uri: Cl.some(Cl.stringUtf8("https://example.com/batch/1.json"))
      },
      {
        recipient: Cl.principal(address2),
        uri: Cl.some(Cl.stringUtf8("https://example.com/batch/2.json"))
      }
    ];

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [Cl.list(recipients.map(r => Cl.tuple(r)))],
      deployer
    );
    expect(result).toBeOk(Cl.list([Cl.uint(4), Cl.uint(5)]));

    // Verify tokens were minted
    const owner1 = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(4)],
      address1
    );
    expect(owner1.result).toBeOk(Cl.some(Cl.principal(address2)));

    const owner2 = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(5)],
      address1
    );
    expect(owner2.result).toBeOk(Cl.some(Cl.principal(address2)));
  });

  it("should allow batch burning by owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "batch-burn",
      [Cl.list([Cl.uint(1), Cl.uint(2)])],
      address1
    );
    expect(result).toBeOk(Cl.uint(2));

    // Verify tokens were burned
    const owner1 = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(owner1.result).toBeOk(Cl.none());

    const owner2 = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(2)],
      address1
    );
    expect(owner2.result).toBeOk(Cl.none());
  });

  it("should allow batch transfers", () => {
    const transfers = [
      {
        "token-id": Cl.uint(1),
        recipient: Cl.principal(address2)
      },
      {
        "token-id": Cl.uint(2),
        recipient: Cl.principal(address3)
      }
    ];

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-transfer",
      [Cl.list(transfers.map(t => Cl.tuple(t)))],
      address1
    );
    expect(result).toBeOk(Cl.uint(2));

    // Verify transfers
    const owner1 = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(1)],
      address1
    );
    expect(owner1.result).toBeOk(Cl.some(Cl.principal(address2)));

    const owner2 = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(2)],
      address1
    );
    expect(owner2.result).toBeOk(Cl.some(Cl.principal(address3)));
  });

  it("should reject batch operations when contract is paused", () => {
    // Pause contract
    simnet.callPublicFn(
      contractName,
      "pause-contract",
      [],
      deployer
    );

    // Try batch burn
    const burnResult = simnet.callPublicFn(
      contractName,
      "batch-burn",
      [Cl.list([Cl.uint(1)])],
      address1
    );
    expect(burnResult.result).toBeErr(Cl.uint(406)); // ERR-CONTRACT-PAUSED

    // Try batch transfer
    const transferResult = simnet.callPublicFn(
      contractName,
      "batch-transfer",
      [Cl.list([Cl.tuple({ "token-id": Cl.uint(1), recipient: Cl.principal(address2) })])],
      address1
    );
    expect(transferResult.result).toBeErr(Cl.uint(406)); // ERR-CONTRACT-PAUSED
  });

  it("should reject batch mint from non-owner", () => {
    const recipients = [
      {
        recipient: Cl.principal(address2),
        uri: Cl.some(Cl.stringUtf8("https://example.com/batch/1.json"))
      }
    ];

    const { result } = simnet.callPublicFn(
      contractName,
      "batch-mint",
      [Cl.list(recipients.map(r => Cl.tuple(r)))],
      address1 // Non-owner
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});
describe("Bitdap NFT Collection - Royalty System", () => {
  it("should allow owner to set royalty information", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-royalty-info",
      [Cl.principal(address1), Cl.uint(500)], // 5% royalty
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify royalty info
    const royaltyResult = simnet.callReadOnlyFn(
      contractName,
      "get-royalty-info",
      [],
      address1
    );
    expect(royaltyResult.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(address1),
        percentage: Cl.uint(500),
        "max-percentage": Cl.uint(1000),
        "total-collected": Cl.uint(0)
      })
    );
  });

  it("should calculate royalty amounts correctly", () => {
    // Set 5% royalty
    simnet.callPublicFn(
      contractName,
      "set-royalty-info",
      [Cl.principal(address1), Cl.uint(500)],
      deployer
    );

    // Calculate royalty for 1000 STX sale
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "calculate-royalty",
      [Cl.uint(1000000000)], // 1000 STX in microSTX
      address1
    );
    expect(result).toBeOk(
      Cl.tuple({
        "sale-price": Cl.uint(1000000000),
        "royalty-amount": Cl.uint(50000000), // 50 STX (5%)
        "royalty-percentage": Cl.uint(500),
        recipient: Cl.principal(address1)
      })
    );
  });

  it("should record royalty payments", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "record-royalty-payment",
      [Cl.uint(50000000)], // 50 STX
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check total collected
    const royaltyResult = simnet.callReadOnlyFn(
      contractName,
      "get-royalty-info",
      [],
      address1
    );
    expect(royaltyResult.result).toBeOk(
      Cl.tuple({
        recipient: Cl.principal(deployer),
        percentage: Cl.uint(0),
        "max-percentage": Cl.uint(1000),
        "total-collected": Cl.uint(50000000)
      })
    );
  });

  it("should reject royalty percentage above maximum", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-royalty-info",
      [Cl.principal(address1), Cl.uint(1500)], // 15% (above 10% max)
      deployer
    );
    expect(result).toBeErr(Cl.uint(408)); // ERR-INVALID-ROYALTY
  });

  it("should reject royalty setting from non-owner", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "set-royalty-info",
      [Cl.principal(address1), Cl.uint(500)],
      address1 // Non-owner
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });
});
describe("Bitdap NFT Collection - Fund Management", () => {
  beforeEach(() => {
    // Set mint price to test fund management
    simnet.callPublicFn(
      contractName,
      "set-mint-price",
      [Cl.uint(1000000)], // 1 STX
      deployer
    );
  });

  it("should collect funds from minting", () => {
    // Mint NFT with payment
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      address1
    );
    expect(result).toBeOk(Cl.uint(1));

    // Check contract balance
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-balance",
      [],
      address1
    );
    expect(balanceResult.result).toBeOk(Cl.uint(1000000));
  });

  it("should allow owner to withdraw funds", () => {
    // Mint NFT to generate funds
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      address1
    );

    // Withdraw funds
    const { result } = simnet.callPublicFn(
      contractName,
      "withdraw-funds",
      [Cl.uint(500000)], // 0.5 STX
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check remaining balance
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-balance",
      [],
      address1
    );
    expect(balanceResult.result).toBeOk(Cl.uint(500000));
  });

  it("should allow owner to withdraw all funds", () => {
    // Mint NFT to generate funds
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      address1
    );

    // Withdraw all funds
    const { result } = simnet.callPublicFn(
      contractName,
      "withdraw-all-funds",
      [],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balance is zero
    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-balance",
      [],
      address1
    );
    expect(balanceResult.result).toBeOk(Cl.uint(0));
  });

  it("should reject withdrawal from non-owner", () => {
    // Mint NFT to generate funds
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      address1
    );

    // Try to withdraw as non-owner
    const { result } = simnet.callPublicFn(
      contractName,
      "withdraw-funds",
      [Cl.uint(500000)],
      address1 // Non-owner
    );
    expect(result).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED
  });

  it("should reject withdrawal of more than available balance", () => {
    // Mint NFT to generate funds (1 STX)
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      address1
    );

    // Try to withdraw more than available
    const { result } = simnet.callPublicFn(
      contractName,
      "withdraw-funds",
      [Cl.uint(2000000)], // 2 STX (more than available)
      deployer
    );
    expect(result).toBeErr(Cl.uint(402)); // ERR-INSUFFICIENT-PAYMENT
  });

  it("should reject withdrawal of zero amount", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "withdraw-funds",
      [Cl.uint(0)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR-INVALID-AMOUNT
  });
});
describe("Bitdap NFT Collection - Query Functions and Edge Cases", () => {
  beforeEach(() => {
    // Mint some NFTs for query tests
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.some(Cl.stringUtf8("https://example.com/nft/1.json"))],
      deployer
    );
    simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address2), Cl.some(Cl.stringUtf8("https://example.com/nft/2.json"))],
      deployer
    );
  });

  it("should return comprehensive collection information", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-collection-info",
      [],
      address1
    );
    expect(result).toBeOk(
      Cl.tuple({
        name: Cl.stringAscii("Bitdap NFT Collection"),
        symbol: Cl.stringAscii("BDNFT"),
        description: Cl.stringUtf8("General-purpose NFT collection for Bitdap ecosystem"),
        uri: Cl.none(),
        "total-supply": Cl.uint(2),
        "max-supply": Cl.uint(10000),
        "remaining-supply": Cl.uint(9998),
        owner: Cl.principal(deployer),
        "minting-enabled": Cl.bool(true)
      })
    );
  });

  it("should return detailed token information", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-token-info-detailed",
      [Cl.uint(1)],
      address1
    );
    expect(result).toBeOk(
      Cl.tuple({
        "token-id": Cl.uint(1),
        owner: Cl.some(Cl.tuple({ owner: Cl.principal(address1) })),
        metadata: Cl.some(Cl.tuple({ uri: Cl.some(Cl.stringUtf8("https://example.com/nft/1.json")) })),
        approved: Cl.none(),
        exists: Cl.bool(true)
      })
    );
  });

  it("should return batch token information", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-tokens-info-detailed",
      [Cl.list([Cl.uint(1), Cl.uint(2)])],
      address1
    );
    
    // Should return list of token info
    expect(result).toBeOk(Cl.list([
      Cl.tuple({
        "token-id": Cl.uint(1),
        owner: Cl.some(Cl.tuple({ owner: Cl.principal(address1) })),
        metadata: Cl.some(Cl.tuple({ uri: Cl.some(Cl.stringUtf8("https://example.com/nft/1.json")) })),
        approved: Cl.none(),
        exists: Cl.bool(true)
      }),
      Cl.tuple({
        "token-id": Cl.uint(2),
        owner: Cl.some(Cl.tuple({ owner: Cl.principal(address2) })),
        metadata: Cl.some(Cl.tuple({ uri: Cl.some(Cl.stringUtf8("https://example.com/nft/2.json")) })),
        approved: Cl.none(),
        exists: Cl.bool(true)
      })
    ]));
  });

  it("should return mint count for addresses", () => {
    const { result } = simnet.callReadOnlyFn(
      contractName,
      "get-address-mint-count",
      [Cl.principal(address1)],
      address1
    );
    expect(result).toBeOk(Cl.uint(1));

    const result2 = simnet.callReadOnlyFn(
      contractName,
      "get-address-mint-count",
      [Cl.principal(address3)], // Never minted
      address1
    );
    expect(result2.result).toBeOk(Cl.uint(0));
  });

  it("should handle queries for non-existent tokens", () => {
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(999)],
      address1
    );
    expect(ownerResult.result).toBeOk(Cl.none());

    const uriResult = simnet.callReadOnlyFn(
      contractName,
      "get-token-uri",
      [Cl.uint(999)],
      address1
    );
    expect(uriResult.result).toBeOk(Cl.none());

    const existsResult = simnet.callReadOnlyFn(
      contractName,
      "token-exists?",
      [Cl.uint(999)],
      address1
    );
    expect(existsResult.result).toBeBool(false);
  });

  it("should handle safe mint with validation", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "safe-mint",
      [Cl.principal(address3), Cl.some(Cl.stringUtf8("https://example.com/safe/1.json"))],
      deployer
    );
    expect(result).toBeOk(Cl.uint(3));

    // Verify safe mint worked
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      "get-owner",
      [Cl.uint(3)],
      address1
    );
    expect(ownerResult.result).toBeOk(Cl.some(Cl.principal(address3)));
  });

  it("should handle mint with events", () => {
    const { result, events } = simnet.callPublicFn(
      contractName,
      "mint-with-events",
      [Cl.principal(address3), Cl.some(Cl.stringUtf8("https://example.com/events/1.json"))],
      deployer
    );
    expect(result).toBeOk(Cl.uint(3));
    expect(events.length).toBeGreaterThan(0);

    // Check that events were emitted
    const hasMintEvent = events.some((e: any) => {
      const eventStr = JSON.stringify(e);
      return eventStr.includes("mint-success") || eventStr.includes("mint");
    });
    expect(hasMintEvent).toBe(true);
  });

  it("should handle emergency pause with reason", () => {
    const { result } = simnet.callPublicFn(
      contractName,
      "emergency-pause",
      [Cl.stringUtf8("Security incident detected")],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify contract is paused
    const statusResult = simnet.callReadOnlyFn(
      contractName,
      "get-contract-status",
      [],
      address1
    );
    expect(statusResult.result).toBeOk(
      Cl.tuple({
        paused: Cl.bool(true),
        "minting-enabled": Cl.bool(true),
        owner: Cl.principal(deployer)
      })
    );
  });

  it("should enforce max supply limit", () => {
    // Set very low max supply
    simnet.callPublicFn(
      contractName,
      "set-max-supply",
      [Cl.uint(2)], // Already have 2 minted
      deployer
    );

    // Try to mint another
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address3), Cl.none()],
      deployer
    );
    expect(result).toBeErr(Cl.uint(405)); // ERR-MAX-SUPPLY-REACHED
  });

  it("should enforce per-address minting limit", () => {
    // Set low per-address limit
    simnet.callPublicFn(
      contractName,
      "set-per-address-limit",
      [Cl.uint(1)], // address1 already has 1
      deployer
    );

    // Try to mint another to address1
    const { result } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(address1), Cl.none()],
      deployer
    );
    expect(result).toBeErr(Cl.uint(403)); // ERR-MINT-LIMIT-EXCEEDED
  });
});