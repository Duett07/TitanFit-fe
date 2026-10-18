"use client";

import { useEffect, useRef } from "react";

export type SyncEventType =
  | "ORDER_UPDATED"
  | "PRODUCT_UPDATED"
  | "INVENTORY_UPDATED"
  | "CART_UPDATED"
  | "AUTH_CHANGED";

const CHANNEL_NAME = "titanfit_realtime_sync";
const STORAGE_KEY = "titanfit_last_sync_event";
const INTERNAL_EVENT_NAME = "titanfit_sync";

export interface SyncMessage {
  id: string;
  type: SyncEventType;
  payload?: unknown;
  timestamp: number;
}

// Bounded LRU-style set of seen event IDs to prevent duplicate delivery across BroadcastChannel and StorageEvent transports
const seenTransportEventIds = new Set<string>();
function markAndCheckTransportEvent(id: string): boolean {
  if (seenTransportEventIds.has(id)) {
    return true; // Already processed by transport
  }
  seenTransportEventIds.add(id);
  // Keep size bounded to prevent memory growth
  if (seenTransportEventIds.size > 100) {
    const first = seenTransportEventIds.values().next().value;
    if (first) seenTransportEventIds.delete(first);
  }
  return false;
}

// Singleton hub state for cross-tab transport bridging
let sharedChannel: BroadcastChannel | null = null;
let isHubInitialized = false;

function dispatchInternalSync(message: SyncMessage) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent(INTERNAL_EVENT_NAME, { detail: message })
    );
  } catch {
    // ignore
  }
}

/**
 * Initializes the single tab-level cross-tab transport hub.
 * Ensures only ONE BroadcastChannel and ONE storage listener exist per browser tab,
 * forwarding valid cross-tab events into the local window event bus.
 */
function ensureSyncHubInitialized(): BroadcastChannel | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hasBroadcastChannel = "BroadcastChannel" in window;

  if (hasBroadcastChannel && !sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
      sharedChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
        const msg = event.data;
        if (!msg || !msg.id) return;
        // Transport deduplication (prevents double dispatch if storage or reflection also fires)
        if (markAndCheckTransportEvent(msg.id)) return;
        dispatchInternalSync(msg);
      };
    } catch {
      sharedChannel = null;
    }
  }

  if (!isHubInitialized) {
    isHubInitialized = true;

    // Listen to StorageEvent as fallback for browsers without BroadcastChannel
    // or when cross-tab communication occurs across isolated window contexts
    window.addEventListener("storage", (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as SyncMessage;
          if (!parsed || !parsed.id) return;
          // Deduplicate at transport layer: if BroadcastChannel already delivered this ID, skip it
          if (markAndCheckTransportEvent(parsed.id)) return;
          dispatchInternalSync(parsed);
        } catch {
          // ignore parsing error
        }
      }
    });
  }

  return sharedChannel;
}

/**
 * Emit a synchronization event across all browser tabs and the current window
 */
export function emitSyncEvent(type: SyncEventType, payload?: unknown) {
  if (typeof window === "undefined") return;

  const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const message: SyncMessage = {
    id: eventId,
    type,
    payload,
    timestamp: Date.now(),
  };

  // Mark our own emitted event ID so incoming echo or storage events in this tab are ignored by transport
  markAndCheckTransportEvent(eventId);

  const channel = ensureSyncHubInitialized();

  // 1. BroadcastChannel (native, instant cross-tab communication)
  if (channel) {
    try {
      channel.postMessage(message);
    } catch {
      // ignore
    }
  }

  // 2. LocalStorage event (fallback for browsers/environments without BroadcastChannel)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
  } catch {
    // ignore
  }

  // 3. Local internal event (notifies all mounted useAutoSync hooks in the CURRENT window/tab)
  dispatchInternalSync(message);
}

interface UseAutoSyncOptions {
  /**
   * The list of event types to listen for.
   * If omitted, will trigger on all sync events.
   */
  eventTypes?: SyncEventType[];
  /**
   * Callback function to reload data from backend
   */
  onSync: (message?: SyncMessage) => void | Promise<void>;
  /**
   * Optional periodic heartbeat interval in ms (e.g. 60000 = 60s).
   * Set to 0 or leave undefined to disable polling.
   */
  intervalMs?: number;
  /**
   * Whether to re-fetch when user switches back to this tab (focus/visibility change)
   * Defaults to true.
   */
  enableFocusSync?: boolean;
}

/**
 * React hook to auto-sync data:
 * - Across multiple tabs (via Single Hub BroadcastChannel & Storage events with transport deduplication)
 * - Across all mounted components in the current tab without event starvation
 * - On window focus / tab visibility change (instant refresh when switching tabs)
 * - On periodic heartbeat interval (background polling while tab is active)
 */
export function useAutoSync({
  eventTypes,
  onSync,
  intervalMs = 0,
  enableFocusSync = true,
}: UseAutoSyncOptions) {
  const onSyncRef = useRef(onSync);
  const eventTypesRef = useRef(eventTypes);

  // Synchronize refs safely in effect rather than during render phase (React 19 compliant)
  useEffect(() => {
    onSyncRef.current = onSync;
    eventTypesRef.current = eventTypes;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ensure the single tab-level cross-tab transport hub is listening
    ensureSyncHubInitialized();

    // Helper to check if event type matches filter
    const shouldHandle = (msg: SyncMessage) => {
      if (!msg || !msg.type) return false;
      const types = eventTypesRef.current;
      return !types || types.length === 0 || types.includes(msg.type);
    };

    // 1. Listen via local internal custom event bus
    // Every mounted hook receives this event without being starved by other hooks
    const handleLocalSync = (event: Event) => {
      const customEvent = event as CustomEvent<SyncMessage>;
      if (customEvent.detail && shouldHandle(customEvent.detail)) {
        try {
          onSyncRef.current(customEvent.detail);
        } catch (error) {
          console.error("AutoSync callback error:", error);
        }
      }
    };
    window.addEventListener(INTERNAL_EVENT_NAME, handleLocalSync);

    // 2. Listen to Window Focus & Visibility Change (triggers when user switches back to this tab)
    let lastFocusTime = Date.now();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        // Throttle to at most once per 2s to avoid duplicate triggers
        const now = Date.now();
        if (now - lastFocusTime > 2000) {
          lastFocusTime = now;
          onSyncRef.current();
        }
      }
    };

    if (enableFocusSync) {
      window.addEventListener("focus", handleVisibilityOrFocus);
      document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    }

    // 3. Periodic polling (only when tab is visible)
    let timerId: NodeJS.Timeout | null = null;
    if (intervalMs > 0) {
      timerId = setInterval(() => {
        if (document.visibilityState === "visible") {
          onSyncRef.current();
        }
      }, intervalMs);
    }

    // Cleanup
    return () => {
      window.removeEventListener(INTERNAL_EVENT_NAME, handleLocalSync);
      if (enableFocusSync) {
        window.removeEventListener("focus", handleVisibilityOrFocus);
        document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      }
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [enableFocusSync, intervalMs]);
}

