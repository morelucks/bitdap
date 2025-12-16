import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Token has correct initial state",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Check token metadata
        let block = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'get-name', [], deployer.address),
            Tx.contractCall('bitdap-token', 'get-symbol', [], deployer.address),
            Tx.contractCall('bitdap-token', 'get-decimals', [], deployer.address),
            Tx.contractCall('bitdap-token', 'get-total-supply', [], deployer.address),
            Tx.contractCall('bitdap-token', 'get-balance', [types.principal(deployer.address)], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 5);
        block.receipts[0].result.expectOk().expectAscii("Bitdap Token");
        block.receipts[1].result.expectOk().expectAscii("BITDAP");
        block.receipts[2].result.expectOk().expectUint(6);
        block.receipts[3].result.expectOk().expectUint(1000000000);
        block.receipts[4].result.expectOk().expectUint(1000000000);
    },
});

Clarinet.test({
    name: "Can transfer tokens successfully",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const transferAmount = 100000000; // 100 tokens
        
        let block = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'transfer', [
                types.uint(transferAmount),
                types.principal(deployer.address),
                types.principal(wallet1.address),
                types.none()
            ], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);
        
        // Check balances after transfer
        let balanceBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'get-balance', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall('bitdap-token', 'get-balance', [types.principal(wallet1.address)], deployer.address),
        ]);
        
        balanceBlock.receipts[0].result.expectOk().expectUint(1000000000 - transferAmount);
        balanceBlock.receipts[1].result.expectOk().expectUint(transferAmount);
    },
});

Clarinet.test({
    name: "Cannot transfer more than balance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const transferAmount = 2000000000; // More than total supply
        
        let block = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'transfer', [
                types.uint(transferAmount),
                types.principal(deployer.address),
                types.principal(wallet1.address),
                types.none()
            ], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(402); // ERR-INSUFFICIENT-BALANCE
    },
});

Clarinet.test({
    name: "Approval and transfer-from works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        const approveAmount = 200000000; // 200 tokens
        const transferAmount = 100000000; // 100 tokens
        
        // Approve wallet1 to spend tokens
        let approveBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'approve', [
                types.principal(wallet1.address),
                types.uint(approveAmount)
            ], deployer.address),
        ]);
        
        approveBlock.receipts[0].result.expectOk().expectBool(true);
        
        // Check allowance
        let allowanceBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'get-allowance', [
                types.principal(deployer.address),
                types.principal(wallet1.address)
            ], deployer.address),
        ]);
        
        allowanceBlock.receipts[0].result.expectOk().expectUint(approveAmount);
        
        // Transfer from deployer to wallet2 using wallet1's allowance
        let transferBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'transfer-from', [
                types.principal(deployer.address),
                types.principal(wallet2.address),
                types.uint(transferAmount),
                types.none()
            ], wallet1.address),
        ]);
        
        transferBlock.receipts[0].result.expectOk().expectBool(true);
        
        // Check final balances and allowance
        let finalBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'get-balance', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall('bitdap-token', 'get-balance', [types.principal(wallet2.address)], deployer.address),
            Tx.contractCall('bitdap-token', 'get-allowance', [
                types.principal(deployer.address),
                types.principal(wallet1.address)
            ], deployer.address),
        ]);
        
        finalBlock.receipts[0].result.expectOk().expectUint(1000000000 - transferAmount);
        finalBlock.receipts[1].result.expectOk().expectUint(transferAmount);
        finalBlock.receipts[2].result.expectOk().expectUint(approveAmount - transferAmount);
    },
});

Clarinet.test({
    name: "Only owner can mint tokens",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const mintAmount = 50000000; // 50 tokens
        
        // Deployer can mint
        let mintBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(mintAmount)
            ], deployer.address),
        ]);
        
        mintBlock.receipts[0].result.expectOk().expectBool(true);
        
        // Non-owner cannot mint
        let failMintBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(mintAmount)
            ], wallet1.address),
        ]);
        
        failMintBlock.receipts[0].result.expectErr().expectUint(401); // ERR-UNAUTHORIZED
        
        // Check balance and total supply
        let checkBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'get-balance', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('bitdap-token', 'get-total-supply', [], deployer.address),
        ]);
        
        checkBlock.receipts[0].result.expectOk().expectUint(mintAmount);
        checkBlock.receipts[1].result.expectOk().expectUint(1000000000 + mintAmount);
    },
});

Clarinet.test({
    name: "Can burn tokens",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const burnAmount = 100000000; // 100 tokens
        
        let burnBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'burn', [
                types.uint(burnAmount)
            ], deployer.address),
        ]);
        
        burnBlock.receipts[0].result.expectOk().expectBool(true);
        
        // Check balance and total supply after burn
        let checkBlock = chain.mineBlock([
            Tx.contractCall('bitdap-token', 'get-balance', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall('bitdap-token', 'get-total-supply', [], deployer.address),
        ]);
        
        checkBlock.receipts[0].result.expectOk().expectUint(1000000000 - burnAmount);
        checkBlock.receipts[1].result.expectOk().expectUint(1000000000 - burnAmount);
    },
});