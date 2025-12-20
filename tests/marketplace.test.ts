import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Marketplace - Listing Creation", () => {
  beforeEach(() => {
    // Mint a pass for wallet1
    simnet.callPublicFn(
      "bitdap",
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      wallet1
    );
  });

  it("should create a listing successfully", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "create-listing",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    expect(result.result).toBeOk(Cl.uint(1));
  });

  it("should fail if price is zero", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "create-listing",
      [Cl.uint(1), Cl.uint(0), Cl.uint(100)],
      wallet1
    );

    expect(result.result).toBeErr(Cl.uint(109)); // ERR-INVALID-PRICE
  });

  it("should fail if not token owner", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "create-listing",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(100)],
      wallet2
    );

    expect(result.result).toBeErr(Cl.uint(102)); // ERR-NOT-OWNER
  });

  it("should increment listing count", () => {
    simnet.callPublicFn(
      "bitdap",
      "create-listing",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const counters = simnet.callReadOnlyFn(
      "bitdap",
      "get-counters",
      [],
      deployer
    );

    const result = counters.result as any;
    expect(result.value.listings.value).toBe(1n);
  });

  it("should track seller listings", () => {
    simnet.callPublicFn(
      "bitdap",
      "create-listing",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "bitdap",
      "get-seller-listings",
      [Cl.principal(wallet1)],
      deployer
    );

    expect(result.result).toBeOk();
  });
});

describe("Marketplace - Purchase", () => {
  beforeEach(() => {
    // Mint passes for wallet1 and wallet2
    simnet.callPublicFn(
      "bitdap",
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      wallet1
    );
    simnet.callPublicFn(
      "bitdap",
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      wallet2
    );

    // Create listing
    simnet.callPublicFn(
      "bitdap",
      "create-listing",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );
  });

  it("should purchase listing successfully", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "purchase-listing",
      [Cl.uint(1)],
      wallet2
    );

    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("should transfer token to buyer", () => {
    simnet.callPublicFn(
      "bitdap",
      "purchase-listing",
      [Cl.uint(1)],
      wallet2
    );

    const owner = simnet.callReadOnlyFn(
      "bitdap",
      "get-owner",
      [Cl.uint(1)],
      deployer
    );

    expect(owner.result).toBeOk(Cl.principal(wallet2));
  });

  it("should fail if seller tries to buy own listing", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "purchase-listing",
      [Cl.uint(1)],
      wallet1
    );

    expect(result.result).toBeErr(Cl.uint(103)); // ERR-SELF-TRANSFER
  });

  it("should deactivate listing after purchase", () => {
    simnet.callPublicFn(
      "bitdap",
      "purchase-listing",
      [Cl.uint(1)],
      wallet2
    );

    const isActive = simnet.callReadOnlyFn(
      "bitdap",
      "is-listing-active",
      [Cl.uint(1)],
      deployer
    );

    expect(isActive.result).toBeOk(Cl.bool(false));
  });

  it("should record purchase history", () => {
    simnet.callPublicFn(
      "bitdap",
      "purchase-listing",
      [Cl.uint(1)],
      wallet2
    );

    const history = simnet.callReadOnlyFn(
      "bitdap",
      "get-purchase-history",
      [Cl.principal(wallet2), Cl.uint(1)],
      deployer
    );

    expect(history.result).toBeOk();
  });

  it("should decrement listing count after purchase", () => {
    simnet.callPublicFn(
      "bitdap",
      "purchase-listing",
      [Cl.uint(1)],
      wallet2
    );

    const counters = simnet.callReadOnlyFn(
      "bitdap",
      "get-counters",
      [],
      deployer
    );

    const result = counters.result as any;
    expect(result.value.listings.value).toBe(0n);
  });
});

describe("Marketplace - Fee Management", () => {
  it("should set marketplace fee", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "set-marketplace-fee",
      [Cl.uint(3)],
      deployer
    );

    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("should fail if non-admin sets fee", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "set-marketplace-fee",
      [Cl.uint(3)],
      wallet1
    );

    expect(result.result).toBeErr(Cl.uint(106)); // ERR-UNAUTHORIZED
  });

  it("should fail if fee exceeds 10%", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "set-marketplace-fee",
      [Cl.uint(11)],
      deployer
    );

    expect(result.result).toBeErr(Cl.uint(109)); // ERR-INVALID-PRICE
  });

  it("should set fee recipient", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "set-fee-recipient",
      [Cl.principal(wallet3)],
      deployer
    );

    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("should get marketplace fee info", () => {
    simnet.callPublicFn(
      "bitdap",
      "set-marketplace-fee",
      [Cl.uint(2)],
      deployer
    );

    const info = simnet.callReadOnlyFn(
      "bitdap",
      "get-marketplace-fee-info",
      [],
      deployer
    );

    expect(info.result).toBeOk();
  });
});

describe("Marketplace - Listing Updates", () => {
  beforeEach(() => {
    simnet.callPublicFn(
      "bitdap",
      "mint-pass",
      [Cl.uint(1), Cl.none()],
      wallet1
    );

    simnet.callPublicFn(
      "bitdap",
      "create-listing",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );
  });

  it("should update listing price", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(2000000)],
      wallet1
    );

    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("should fail to update if not seller", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(2000000)],
      wallet2
    );

    expect(result.result).toBeErr(Cl.uint(102)); // ERR-NOT-OWNER
  });

  it("should cancel listing", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );

    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("should fail to cancel if not seller", () => {
    const result = simnet.callPublicFn(
      "bitdap",
      "cancel-listing",
      [Cl.uint(1)],
      wallet2
    );

    expect(result.result).toBeErr(Cl.uint(102)); // ERR-NOT-OWNER
  });

  it("should decrement listing count on cancel", () => {
    simnet.callPublicFn(
      "bitdap",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );

    const counters = simnet.callReadOnlyFn(
      "bitdap",
      "get-counters",
      [],
      deployer
    );

    const result = counters.result as any;
    expect(result.value.listings.value).toBe(0n);
  });
});
