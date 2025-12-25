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