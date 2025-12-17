#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Get mnemonic from Testnet.toml
MNEMONIC=$(grep "mnemonic = " settings/Testnet.toml | sed 's/.*mnemonic = "\(.*\)"/\1/')
export MAINNET_MNEMONIC="$MNEMONIC"

echo "🚀 Starting automated mainnet deployment..."
echo "Deployer: SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB"
echo ""

# Create Mainnet.toml from template
envsubst < settings/Mainnet.template.toml > settings/Mainnet.toml

# Generate deployment plan
echo "Generating deployment plan..."
clarinet deployments generate --mainnet --medium-cost

# Deploy using expect to handle interactive prompts
if command -v expect &> /dev/null; then
    expect << 'EOF'
spawn clarinet deployments apply --mainnet
expect "Overwrite? \\[Y/n\\]?" { send "Y\r" }
expect "Continue \\[Y/n\\]?" { send "Y\r" }
expect eof
EOF
else
    echo "⚠️  'expect' not found. Using manual method..."
    echo ""
    echo "Please run this command manually:"
    echo "  clarinet deployments apply --mainnet"
    echo ""
    echo "And type 'Y' when prompted (twice)."
    exit 1
fi

# Clean up
rm -f settings/Mainnet.toml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Verify deployment at:"
echo "  https://explorer.stacks.co/address/SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB?chain=mainnet"


