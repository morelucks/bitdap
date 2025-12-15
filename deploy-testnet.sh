#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ -z "${TESTNET_MNEMONIC:-}" ]]; then
  echo "ERROR: TESTNET_MNEMONIC is not set in your environment."
  echo "Export it first, e.g.:"
  echo "  export TESTNET_MNEMONIC=\"your 24-word testnet seed\""
  exit 1
fi

echo "Generating temporary settings/Testnet.toml from template..."
envsubst < settings/Testnet.template.toml > settings/Testnet.toml

echo "Running Clarinet deployments for testnet..."
clarinet deployments generate --testnet --medium-cost
clarinet deployments apply --testnet

echo "Cleaning up temporary settings/Testnet.toml..."
rm -f settings/Testnet.toml

echo "Done. Your contract should now be deployed to testnet."


