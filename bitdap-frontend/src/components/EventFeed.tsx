"use client";

import { useChainhooks, BitdapEvent } from "@hooks/useChainhooks";
import { contractsConfig } from "@config/contracts";
import styles from "./EventFeed.module.css";

export function EventFeed() {
  const { events, isConnected, connect, clearEvents, getMintEvents, getTransferEvents, getBurnEvents } = useChainhooks();

  const mintEvents = getMintEvents();
  const transferEvents = getTransferEvents();
  const burnEvents = getBurnEvents();

  const formatEventType = (event: string) => {
    return event.replace("-event", "").toUpperCase();
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "N/A";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case "mint-event":
        return "✨";
      case "transfer-event":
        return "🔄";
      case "burn-event":
        return "🔥";
      default:
        return "📋";
    }
  };

  return (
    <div className={styles.eventFeed}>
      <div className={styles.header}>
        <h3>Real-Time Events</h3>
        <div className={styles.controls}>
          <button
            onClick={connect}
            className={styles.connectButton}
            disabled={isConnected}
          >
            {isConnected ? "✓ Connected" : "Connect Events"}
          </button>
          {events.length > 0 && (
            <button onClick={clearEvents} className={styles.clearButton}>
              Clear ({events.length})
            </button>
          )}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Mints:</span>
          <span className={styles.statValue}>{mintEvents.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Transfers:</span>
          <span className={styles.statValue}>{transferEvents.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Burns:</span>
          <span className={styles.statValue}>{burnEvents.length}</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className={styles.empty}>
          <p>No events yet. Events will appear here when:</p>
          <ul>
            <li>Someone mints a new Pass</li>
            <li>A Pass is transferred</li>
            <li>A Pass is burned</li>
          </ul>
          <p className={styles.note}>
            💡 Set up Chainhooks webhooks to receive real-time events.
            See <code>chainhooks-quickstart.md</code> for instructions.
          </p>
        </div>
      ) : (
        <div className={styles.eventsList}>
          {events.map((event, index) => (
            <div key={index} className={styles.eventItem}>
              <div className={styles.eventIcon}>{getEventIcon(event.event)}</div>
              <div className={styles.eventContent}>
                <div className={styles.eventHeader}>
                  <span className={styles.eventType}>
                    {formatEventType(event.event)}
                  </span>
                  <span className={styles.eventTime}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={styles.eventDetails}>
                  {event.tokenId !== undefined && (
                    <span>Token #{event.tokenId}</span>
                  )}
                  {event.tier !== undefined && (
                    <span className={styles.tier}>Tier {event.tier}</span>
                  )}
                  {event.owner && (
                    <span className={styles.address}>
                      Owner: {formatAddress(event.owner)}
                    </span>
                  )}
                  {event.from && (
                    <span className={styles.address}>
                      From: {formatAddress(event.from)}
                    </span>
                  )}
                  {event.to && (
                    <span className={styles.address}>
                      To: {formatAddress(event.to)}
                    </span>
                  )}
                  {event.txId && (
                    <a
                      href={`${contractsConfig.explorerBase}/txid/${event.txId}?chain=${contractsConfig.network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.txLink}
                    >
                      View TX
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

