'use client';

import { contractsConfig, formatNetworkLabel } from "@config/contracts";
import { WalletConnect } from "@/components/WalletConnect";

const sections = [
  {
    title: "Network",
    rows: [
      {
        label: "Network",
        value: formatNetworkLabel(contractsConfig.network)
      },
      {
        label: "Explorer Base",
        value: contractsConfig.explorerBase
      },
      {
        label: "Hiro API",
        value: contractsConfig.apiBase
      }
    ]
  },
  {
    title: "Contracts",
    rows: [
      {
        label: "bitdap",
        value: contractsConfig.bitdap.address,
        link: contractsConfig.bitdap.explorerUrl
      },
      {
        label: "bitdap-token",
        value: contractsConfig.bitdapToken.address,
        link: contractsConfig.bitdapToken.explorerUrl
      }
    ]
  }
];

export default function Home() {
  return (
    <main className="page">
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="pill">Bitdap Frontend Scaffold</div>
        <span className="small">
          Update .env.local with contract addresses and network.
        </span>
      </div>

      <div style={{ marginBottom: 32 }}>
        <WalletConnect />
      </div>

      <div className="grid">
        {sections.map((section) => (
          <section className="card" key={section.title}>
            <h2 className="section-title">{section.title}</h2>
            <div className="grid">
              {section.rows.map((row) => (
                <div key={row.label}>
                  <div className="label">{row.label}</div>
                  {row.link ? (
                    <a className="value" href={row.link} target="_blank">
                      {row.value}
                    </a>
                  ) : (
                    <div className="value">{row.value}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="card">
          <h2 className="section-title">Environment</h2>
          <p className="muted small" style={{ marginTop: 0 }}>
            Copy .env.example to .env.local and set real values:
          </p>
          <ul className="muted small" style={{ margin: "4px 0 0 14px" }}>
            <li>NEXT_PUBLIC_STACKS_NETWORK=mainnet|testnet</li>
            <li>NEXT_PUBLIC_BITDAP_CONTRACT=SP...bitdap</li>
            <li>NEXT_PUBLIC_BITDAP_TOKEN_CONTRACT=SP...bitdap-token</li>
            <li>NEXT_PUBLIC_HIRO_EXPLORER_BASE=https://explorer.hiro.so</li>
            <li>NEXT_PUBLIC_HIRO_API_BASE=https://api.hiro.so</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

