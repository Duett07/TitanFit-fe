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
  type: SyncEventType;
  payload?: unknown;
  timestamp: number;
}

/**
 * Emit a synchronization event across all browser tabs and the current window
 */
export function emitSyncEvent(type: SyncEventType, payload?: unknown) {
  if (typeof window === "undefined") return;

  const message: SyncMessage = {
    type,
    payload,
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel (native, instant cross-tab communication)
  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(message);
      channel.close();
    } catch {
      // ignore
    }
  }

  // 2. LocalStorage event (cross-tab fallback for all browsers)
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
   * Optional periodic heartbeat interval in ms (e.g. 5000 = 5s).
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
 * - Across multiple tabs (via BroadcastChannel & Storage events)
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
  onSyncRef.current = onSync;

  const eventTypesRef = useRef(eventTypes);
  eventTypesRef.current = eventTypes;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Helper to check if event type matches filter
    const shouldHandle = (type: SyncEventType) => {
      const types = eventTypesRef.current;
      return !types || types.length === 0 || types.includes(type);
    };

    // 1. Listen via BroadcastChannel (other tabs)
    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event: MessageEvent<SyncMessage>) => {
          if (event.data && shouldHandle(event.data.type)) {
            onSyncRef.current();
          }
        };
      } catch {
        // ignore
      }
    }

    // 2. Listen via LocalStorage event (fallback for other tabs)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as SyncMessage;
          if (parsed && shouldHandle(parsed.type)) {
            onSyncRef.current();
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Listen via CustomEvent (same tab)
    const handleLocalSync = (event: Event) => {
      const customEvent = event as CustomEvent<SyncMessage>;
      if (customEvent.detail && shouldHandle(customEvent.detail.type)) {
        onSyncRef.current();
      }
    };
    window.addEventListener("titanfit_sync", handleLocalSync);

    // 4. Listen to Window Focus & Visibility Change (triggers when user switches back to this tab)
    let lastFocusTime = Date.now();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        // Throttle to at most once per 1.5s to avoid duplicate triggers
        const now = Date.now();
        if (now - lastFocusTime > 1500) {
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
      window.removeEventListener("storage", handleStorage);
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
