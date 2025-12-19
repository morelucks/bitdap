import { makeContractDeploy, broadcastTransaction, AnchorMode, ClarityVersion } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create network with explicit API URL
const network = createNetwork({
  network: 'mainnet',
  client: { baseUrl: 'https://api.hiro.so' },
});

// SECURITY: Private key MUST come from environment variable only
// Never hardcode private keys in source code!
const privateKey = process.env.MAINNET_PRIVATE_KEY;

if (!privateKey) {
  console.error('❌ ERROR: MAINNET_PRIVATE_KEY environment variable is required');
  console.error('');
  console.error('   Set it before running:');
  console.error('   export MAINNET_PRIVATE_KEY="your-private-key-here"');
  console.error('');
  console.error('   ⚠️  SECURITY WARNING:');
  console.error('   - Never share your private key');
  console.error('   - Never commit it to git');
  console.error('   - Never paste it in chat or logs');
  console.error('   - Store it securely (use a password manager)');
  process.exit(1);
}

async function deployContract(contractName: string, contractPath: string, fee?: number) {
  console.log(`\n📦 Deploying ${contractName}...`);
  
  const contractCode = readFileSync(contractPath, 'utf-8');
  
  // Use fees from deployment plan or default
  const contractFees: Record<string, number> = {
    'bitdap': 230980,
    'bitdap-token': 112040,
  };
  
  const txFee = fee || contractFees[contractName] || 300000;
  
  const txOptions = {
    contractName,
    codeBody: contractCode,
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.OnChainOnly,
    clarityVersion: ClarityVersion.Clarity4,
    fee: txFee,
  };

  try {
    console.log(`   Fee: ${txFee} microSTX (${txFee / 1000000} STX)`);
    const transaction = await makeContractDeploy(txOptions);
    console.log(`✅ Transaction created: ${transaction.txid()}`);
    console.log(`   Broadcasting to mainnet...`);
    
    const broadcastResponse = await broadcastTransaction({ transaction, network });
    
    if ('error' in broadcastResponse) {
      console.error(`❌ Error broadcasting: ${broadcastResponse.error}`);
      if ('reason' in broadcastResponse && broadcastResponse.reason) {
        console.error(`   Reason: ${broadcastResponse.reason}`);
      }
      return null;
    }
    
    console.log(`✅ Transaction broadcasted successfully!`);
    console.log(`   TXID: ${broadcastResponse.txid}`);
    console.log(`   Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}`);
    
    return broadcastResponse.txid;
  } catch (error: any) {
    console.error(`❌ Error deploying ${contractName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting mainnet deployment...');
  console.log(`📍 Network: Mainnet`);
  console.log(`🔗 API: ${network.coreApiUrl || 'https://api.hiro.so'}`);
  
  // Deploy contracts one at a time to avoid chaining issues
  const contracts = [
    { name: 'bitdap', path: join(__dirname, '../contracts/bitdap.clar') },
    { name: 'bitdap-token', path: join(__dirname, '../contracts/bitdap-token.clar') },
  ];

  const results = [];
  
  for (const contract of contracts) {
    const txId = await deployContract(contract.name, contract.path);
    results.push({ name: contract.name, txId });
    
    // Wait a bit between deployments to avoid nonce issues
    if (contracts.indexOf(contract) < contracts.length - 1) {
      console.log('\n⏳ Waiting 10 seconds before next deployment...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log('\n📊 Deployment Summary:');
  console.log('='.repeat(50));
  results.forEach(({ name, txId }) => {
    if (txId) {
      console.log(`✅ ${name}: ${txId}`);
      console.log(`   https://explorer.hiro.so/txid/${txId}`);
    } else {
      console.log(`❌ ${name}: Failed`);
    }
  });
  console.log('='.repeat(50));
}

main().catch(console.error);

