"use client";

import { useEffect, useRef } from "react";

export type SyncEventType =
  | "ORDER_UPDATED"
  | "PRODUCT_UPDATED"
  | "INVENTORY_UPDATED"
  | "CART_UPDATED";

const CHANNEL_NAME = "titanfit_realtime_sync";
const STORAGE_KEY = "titanfit_last_sync_event";

export interface SyncMessage {
  id: string;
  type: SyncEventType;
  payload?: unknown;
  timestamp: number;
}

// Bounded LRU-style set of seen event IDs to prevent duplicate execution across BroadcastChannel and Storage
const seenEventIds = new Set<string>();
function markAndCheckEventId(id: string): boolean {
  if (seenEventIds.has(id)) {
    return true; // Already processed
  }
  seenEventIds.add(id);
  // Keep size under 100 entries to prevent memory growth
  if (seenEventIds.size > 100) {
    const first = seenEventIds.values().next().value;
    if (first) seenEventIds.delete(first);
  }
  return false;
}

// Shared singleton BroadcastChannel instance for efficient message dispatch
let sharedChannel: BroadcastChannel | null = null;
function getSharedBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      sharedChannel = null;
    }
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

  // Mark our own emitted event ID as seen locally
  markAndCheckEventId(eventId);

  // 1. BroadcastChannel (native, instant cross-tab communication)
  const channel = getSharedBroadcastChannel();
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

  // 3. Local custom event (notifies components in the CURRENT window/tab)
  try {
    window.dispatchEvent(
      new CustomEvent("titanfit_sync", { detail: message })
    );
  } catch {
    // ignore
  }
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
  onSync: () => void | Promise<void>;
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
 * - Across multiple tabs (via BroadcastChannel & Storage events with deduplication)
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

  // Synchronize refs safely in effect rather than during render phase
  useEffect(() => {
    onSyncRef.current = onSync;
    eventTypesRef.current = eventTypes;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Helper to check if event type matches filter
    const shouldHandle = (msg: SyncMessage) => {
      if (!msg || !msg.id) return false;
      if (markAndCheckEventId(msg.id)) return false; // Deduplicate duplicate events

      const types = eventTypesRef.current;
      return !types || types.length === 0 || types.includes(msg.type);
    };

    // 1. Listen via BroadcastChannel (other tabs)
    let channel: BroadcastChannel | null = null;
    const hasBroadcastChannel = "BroadcastChannel" in window;
    if (hasBroadcastChannel) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event: MessageEvent<SyncMessage>) => {
          if (event.data && shouldHandle(event.data)) {
            onSyncRef.current();
          }
        };
      } catch {
        // ignore
      }
    }

    // 2. Listen via LocalStorage event (cross-tab fallback ONLY when BroadcastChannel is unavailable)
    const handleStorage = (event: StorageEvent) => {
      if (!hasBroadcastChannel && event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as SyncMessage;
          if (parsed && shouldHandle(parsed)) {
            onSyncRef.current();
          }
        } catch {
          // ignore
        }
      }
    };
    if (!hasBroadcastChannel) {
      window.addEventListener("storage", handleStorage);
    }

    // 3. Listen via CustomEvent (same tab)
    const handleLocalSync = (event: Event) => {
      const customEvent = event as CustomEvent<SyncMessage>;
      if (customEvent.detail && shouldHandle(customEvent.detail)) {
        onSyncRef.current();
      }
    };
    window.addEventListener("titanfit_sync", handleLocalSync);

    // 4. Listen to Window Focus & Visibility Change (triggers when user switches back to this tab)
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

    // 5. Periodic polling (only when tab is visible)
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
      if (channel) {
        try {
          channel.close();
        } catch {
          // ignore
        }
      }
      if (!hasBroadcastChannel) {
        window.removeEventListener("storage", handleStorage);
      }
      window.removeEventListener("titanfit_sync", handleLocalSync);
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

