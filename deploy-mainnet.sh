#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "⚠️  WARNING: You are about to deploy to STACKS MAINNET"
echo "⚠️  This will cost REAL STX and is PERMANENT"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [[ "$confirm" != "yes" ]]; then
  echo "Deployment cancelled."
  exit 1
fi

if [[ -z "${MAINNET_MNEMONIC:-}" ]]; then
  echo "ERROR: MAINNET_MNEMONIC is not set in your environment."
  echo "Export it first, e.g.:"
  echo "  export MAINNET_MNEMONIC=\"your 24-word mainnet seed phrase\""
  echo ""
  echo "⚠️  SECURITY WARNING: Never share your mnemonic or commit it to git!"
  exit 1
fi

# Check if Mainnet.toml template exists, if not create one
if [[ ! -f "settings/Mainnet.template.toml" ]]; then
  echo "Creating Mainnet.template.toml from Mainnet.toml..."
  cp settings/Mainnet.toml settings/Mainnet.template.toml
  # Replace mnemonic with placeholder
  sed -i 's/mnemonic = ".*"/mnemonic = "${MAINNET_MNEMONIC}"/' settings/Mainnet.template.toml
fi

echo "Generating temporary settings/Mainnet.toml from template..."
envsubst < settings/Mainnet.template.toml > settings/Mainnet.toml

echo ""
echo "Checking contract before deployment..."
clarinet check

echo ""
echo "Generating deployment plan for mainnet..."
clarinet deployments generate --mainnet --medium-cost

echo ""
echo "Review the deployment plan in deployments/default.mainnet-plan.yaml"
read -p "Press Enter to continue with deployment, or Ctrl+C to cancel..."

echo ""
echo "🚀 Deploying to Stacks Mainnet..."
clarinet deployments apply --mainnet

echo ""
echo "Cleaning up temporary settings/Mainnet.toml..."
rm -f settings/Mainnet.toml

echo ""
echo "✅ Deployment complete!"
echo "Your contract should now be deployed to Stacks Mainnet."
echo "Check the transaction on: https://explorer.stacks.co"

