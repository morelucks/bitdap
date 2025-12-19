"use client";

import { useState, useEffect, useCallback } from "react";
import { contractsConfig } from "@config/contracts";

export interface BitdapEvent {
  event: "mint-event" | "transfer-event" | "burn-event";
  tokenId: number;
  owner?: string;
  from?: string;
  to?: string;
  tier?: number;
  timestamp: string;
  txId?: string;
}

export function useChainhooks() {
  const [events, setEvents] = useState<BitdapEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("bitdap_events");
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        setEvents(parsed);
      } catch (e) {
        console.error("Failed to load saved events:", e);
      }
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (events.length > 0) {
      // Keep only last 100 events
      const recentEvents = events.slice(-100);
      localStorage.setItem("bitdap_events", JSON.stringify(recentEvents));
    }
  }, [events]);

  // Connect to webhook endpoint for real-time updates
  const connect = useCallback(async () => {
    try {
      // In production, this would connect to a WebSocket or SSE endpoint
      // For now, we'll poll the API endpoint
      setIsConnected(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsConnected(false);
    }
  }, []);

  // Add event manually (called by webhook handler)
  const addEvent = useCallback((event: BitdapEvent) => {
    setEvents((prev) => {
      // Avoid duplicates based on txId
      if (event.txId && prev.some((e) => e.txId === event.txId)) {
        return prev;
      }
      return [...prev, event].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
  }, []);

  // Poll for new events (fallback if webhooks aren't available)
  const pollEvents = useCallback(async () => {
    try {
      const response = await fetch(`${contractsConfig.webhookUrl}/events`);
      if (response.ok) {
        const data = await response.json();
        if (data.events && Array.isArray(data.events)) {
          data.events.forEach((event: BitdapEvent) => addEvent(event));
        }
      }
    } catch (err) {
      // Silently fail - webhooks might not be set up yet
      console.debug("Polling events failed (this is normal if webhooks aren't configured):", err);
    }
  }, [addEvent]);

  // Poll every 30 seconds if connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(pollEvents, 30000);
    pollEvents(); // Initial poll

    return () => clearInterval(interval);
  }, [isConnected, pollEvents]);

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
    localStorage.removeItem("bitdap_events");
  }, []);

  // Filter events by type
  const getMintEvents = useCallback(() => {
    return events.filter((e) => e.event === "mint-event");
  }, [events]);

  const getTransferEvents = useCallback(() => {
    return events.filter((e) => e.event === "transfer-event");
  }, [events]);

  const getBurnEvents = useCallback(() => {
    return events.filter((e) => e.event === "burn-event");
  }, [events]);

  return {
    events,
    isConnected,
    error,
    connect,
    addEvent,
    clearEvents,
    getMintEvents,
    getTransferEvents,
    getBurnEvents,
  };
}

