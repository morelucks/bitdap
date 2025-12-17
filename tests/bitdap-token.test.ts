import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractName = "bitdap-token";

describe("Bitdap Token - Basic Functionality", () => {
  it("should have correct token metadata", () => {
    const nameResult = simnet.callReadOnlyFn(
      contractName,
      "get-name",
      [],
      deployer
    );
    expect(nameResult.result).toBeOk(Cl.stringAscii("Bitdap Token"));

    const symbolResult = simnet.callReadOnlyFn(
      contractName,
      "get-symbol",
      [],
      deployer
    );
    expect(symbolResult.result).toBeOk(Cl.stringAscii("BITDAP"));

    const decimalsResult = simnet.callReadOnlyFn(
      contractName,
      "get-decimals",
      [],
      deployer
    );
    expect(decimalsResult.result).toBeOk(Cl.uint(6));

    const supplyResult = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      deployer
    );
    expect(supplyResult.result).toBeOk(Cl.uint(1000000000));

    const balanceResult = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    );
    expect(balanceResult.result).toBeOk(Cl.uint(1000000000));
  });

  it("should transfer tokens successfully", () => {
    const wallet1 = accounts.get("wallet_1")!;
    const transferAmount = 100000000; // 100 tokens

    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [
        Cl.uint(transferAmount),
        Cl.principal(deployer),
        Cl.principal(wallet1),
        Cl.none(),
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balances after transfer
    const deployerBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    );
    expect(deployerBalance.result).toBeOk(Cl.uint(1000000000 - transferAmount));

    const wallet1Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(wallet1Balance.result).toBeOk(Cl.uint(transferAmount));
  });

  it("should reject transfer exceeding balance", () => {
    const wallet1 = accounts.get("wallet_1")!;
    const transferAmount = 2000000000; // More than total supply

    const { result } = simnet.callPublicFn(
      contractName,
      "transfer",
      [
        Cl.uint(transferAmount),
        Cl.principal(deployer),
        Cl.principal(wallet1),
        Cl.none(),
      ],
      deployer
    );
    expect(result).toBeErr(Cl.uint(402)); // ERR-INSUFFICIENT-BALANCE
  });

  it("should handle approval and transfer-from correctly", () => {
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;
    const approveAmount = 200000000; // 200 tokens
    const transferAmount = 100000000; // 100 tokens

    // Approve wallet1 to spend tokens
    const { result: approveRes } = simnet.callPublicFn(
      contractName,
      "approve",
      [Cl.principal(wallet1), Cl.uint(approveAmount)],
      deployer
    );
    expect(approveRes).toBeOk(Cl.bool(true));

    // Check allowance
    const allowanceRes = simnet.callReadOnlyFn(
      contractName,
      "get-allowance",
      [Cl.principal(deployer), Cl.principal(wallet1)],
      deployer
    );
    expect(allowanceRes.result).toBeOk(Cl.uint(approveAmount));

    // Transfer from deployer to wallet2 using wallet1's allowance
    const { result: transferRes } = simnet.callPublicFn(
      contractName,
      "transfer-from",
      [
        Cl.principal(deployer),
        Cl.principal(wallet2),
        Cl.uint(transferAmount),
        Cl.none(),
      ],
      wallet1
    );
    expect(transferRes).toBeOk(Cl.bool(true));

    // Check final balances and allowance
    const finalDeployerBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    );
    expect(finalDeployerBalance.result).toBeOk(
      Cl.uint(1000000000 - transferAmount)
    );

    const finalWallet2Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(finalWallet2Balance.result).toBeOk(Cl.uint(transferAmount));

    const finalAllowance = simnet.callReadOnlyFn(
      contractName,
      "get-allowance",
      [Cl.principal(deployer), Cl.principal(wallet1)],
      deployer
    );
    expect(finalAllowance.result).toBeOk(Cl.uint(approveAmount - transferAmount));
  });

  it("should only allow owner to mint tokens", () => {
    const wallet1 = accounts.get("wallet_1")!;
    const mintAmount = 50000000; // 50 tokens

    // Deployer can mint
    const { result: mintRes } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(mintAmount)],
      deployer
    );
    expect(mintRes).toBeOk(Cl.bool(true));

    // Non-owner cannot mint
    const { result: failMintRes } = simnet.callPublicFn(
      contractName,
      "mint",
      [Cl.principal(wallet1), Cl.uint(mintAmount)],
      wallet1
    );
    expect(failMintRes).toBeErr(Cl.uint(401)); // ERR-UNAUTHORIZED

    // Check balance and total supply
    const wallet1Balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(wallet1Balance.result).toBeOk(Cl.uint(mintAmount));

    const totalSupply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      deployer
    );
    expect(totalSupply.result).toBeOk(Cl.uint(1000000000 + mintAmount));
  });

  it("should allow burning tokens", () => {
    const burnAmount = 100000000; // 100 tokens

    const { result: burnRes } = simnet.callPublicFn(
      contractName,
      "burn",
      [Cl.uint(burnAmount)],
      deployer
    );
    expect(burnRes).toBeOk(Cl.bool(true));

    // Check balance and total supply after burn
    const deployerBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.principal(deployer)],
      deployer
    );
    expect(deployerBalance.result).toBeOk(Cl.uint(1000000000 - burnAmount));

    const totalSupply = simnet.callReadOnlyFn(
      contractName,
      "get-total-supply",
      [],
      deployer
    );
    expect(totalSupply.result).toBeOk(Cl.uint(1000000000 - burnAmount));
  });
});