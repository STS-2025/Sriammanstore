/**
 * Durable Fallback Mutation Journal (Outbox) for Dual-Storage Architecture
 *
 * ARCHITECTURAL & STORAGE LIMITATION NOTICE:
 * 1. Separate Backing Stores:
 *    Firestore Emulator and JSON Server (`db.json`) are independent data stores.
 *    Mutations that succeed in JSON Server while Firestore is unreachable do NOT
 *    automatically appear in Firestore until explicitly reconciled by this outbox.
 * 2. Browser-Local Durability Scope:
 *    In browser environments, this journal persists to `window.localStorage` scoped
 *    to the local emulator project (`sass_dual_storage_outbox_demo-sri-amman-store_v1`).
 *    In Node/SSR/test environments without `localStorage`, it falls back to an
 *    in-memory store. Browser `localStorage` is strictly scoped to a single browser
 *    profile/origin on the developer machine and does NOT provide a shared
 *    server-side queue across devices or browsers.
 */

export type OutboxOperationType = "create" | "replace" | "patch" | "delete";
export type OutboxHttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";
export type OutboxSyncStatus = "pending" | "synced" | "conflict" | "failed";

export interface OutboxConflictInfo {
  reason: string;
  detectedAt: string;
  firestoreSnapshot?: unknown;
  fallbackPayload?: unknown;
}

export interface OutboxEntry {
  opId: string;
  idempotencyKey: string;
  resource: string;
  docId: string;
  operationType: OutboxOperationType;
  method: OutboxHttpMethod;
  endpoint: string;
  payload: Record<string, unknown> | null;
  baselineSnapshot?: Record<string, unknown> | null | undefined;
  timestamp: string;
  timestampMs: number;
  status: OutboxSyncStatus;
  attempts: number;
  syncedAt?: string | undefined;
  conflictInfo?: OutboxConflictInfo | undefined;
  lastError?: string | undefined;
}

export const OUTBOX_STORAGE_KEY =
  "sass_dual_storage_outbox_demo-sri-amman-store_v1";

let inMemoryOutbox: OutboxEntry[] = [];

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((item) => stableSerialize(item)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stableSerialize(obj[k])).join(",") +
    "}"
  );
}

export function computeDeterministicIdempotencyKey(params: {
  resource: string;
  docId: string;
  method: OutboxHttpMethod;
  payload?: Record<string, unknown> | null | undefined;
}): string {
  const { resource, docId, method, payload } = params;

  if (method === "POST" && payload) {
    if (resource === "orders") {
      const ordId = String(payload["orderId"] || payload["id"] || docId);
      return `create:orders:${ordId}`;
    }
    if (resource === "notifications") {
      const eventKey = String(payload["eventKey"] || payload["id"] || docId);
      return `create:notifications:${eventKey}`;
    }
    if (resource === "coinHistory") {
      if (payload["id"]) {
        return `create:coinHistory:${String(payload["id"])}`;
      }
      if (payload["userId"] && payload["orderId"] && payload["type"]) {
        return `create:coinHistory:${String(payload["userId"])}:${String(
          payload["orderId"]
        )}:${String(payload["type"])}`;
      }
      return `create:coinHistory:${docId}`;
    }
    if (resource === "referrals") {
      if (payload["userId"] && payload["phoneMasked"]) {
        return `create:referrals:${String(payload["userId"])}:${String(
          payload["phoneMasked"]
        )}`;
      }
      return `create:referrals:${String(payload["id"] || docId)}`;
    }
    return `create:${resource}:${docId}`;
  }

  if (method === "PUT") {
    return `replace:${resource}:${docId}:${stableSerialize(payload ?? {})}`;
  }

  if (method === "PATCH") {
    return `patch:${resource}:${docId}:${stableSerialize(payload ?? {})}`;
  }

  return `delete:${resource}:${docId}`;
}

export function buildOperationId(params: {
  resource: string;
  docId: string;
  method: OutboxHttpMethod;
  payload?: Record<string, unknown> | null | undefined;
  explicitOpId?: string | undefined;
}): string {
  if (params.explicitOpId && params.explicitOpId.trim().length > 0) {
    return params.explicitOpId.trim();
  }
  const idemKey = computeDeterministicIdempotencyKey(params);
  return `op_${idemKey.replace(/[^a-zA-Z0-9_:-]/g, "_")}`;
}

function methodToOperationType(method: OutboxHttpMethod): OutboxOperationType {
  switch (method) {
    case "POST":
      return "create";
    case "PUT":
      return "replace";
    case "PATCH":
      return "patch";
    case "DELETE":
      return "delete";
  }
}

function readPersistedEntries(): OutboxEntry[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(OUTBOX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          inMemoryOutbox = parsed;
          return [...parsed];
        }
      }
    } catch {
      // Fall back to in-memory copy if localStorage is inaccessible
    }
  }
  return [...inMemoryOutbox];
}

function writePersistedEntries(entries: OutboxEntry[]): void {
  inMemoryOutbox = [...entries];
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Best-effort persistence in constrained storage environments
    }
  }
}

export const outboxJournal = {
  getAllEntries(): OutboxEntry[] {
    return readPersistedEntries().sort((a, b) => a.timestampMs - b.timestampMs);
  },

  getPendingEntries(): OutboxEntry[] {
    return this.getAllEntries().filter((e) => e.status === "pending");
  },

  getConflictEntries(): OutboxEntry[] {
    return this.getAllEntries().filter((e) => e.status === "conflict");
  },

  getUnresolvedEntries(): OutboxEntry[] {
    return this.getAllEntries().filter(
      (e) => e.status === "pending" || e.status === "conflict"
    );
  },

  recordFallbackMutation(params: {
    resource: string;
    docId: string;
    method: OutboxHttpMethod;
    endpoint: string;
    payload: Record<string, unknown> | null;
    baselineSnapshot?: Record<string, unknown> | null | undefined;
    explicitOpId?: string | undefined;
    timestampMs?: number | undefined;
  }): OutboxEntry {
    const entries = readPersistedEntries();
    const idempotencyKey = computeDeterministicIdempotencyKey({
      resource: params.resource,
      docId: params.docId,
      method: params.method,
      payload: params.payload,
    });
    const opId = buildOperationId({
      resource: params.resource,
      docId: params.docId,
      method: params.method,
      payload: params.payload,
      explicitOpId: params.explicitOpId,
    });

    const nowMs = params.timestampMs ?? Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const existingIdx = entries.findIndex(
      (e) => e.opId === opId || e.idempotencyKey === idempotencyKey
    );

    if (existingIdx !== -1) {
      const existing = entries[existingIdx];
      if (existing) {
        if (existing.status === "synced") {
          return existing;
        }
        const updated: OutboxEntry = {
          ...existing,
          payload: params.payload,
          timestamp: nowIso,
          timestampMs: nowMs,
          status: "pending",
        };
        entries[existingIdx] = updated;
        writePersistedEntries(entries);
        return updated;
      }
    }

    const earlierPendingForDoc = entries.find(
      (e) =>
        e.resource === params.resource &&
        e.docId === params.docId &&
        (e.status === "pending" || e.status === "conflict") &&
        e.baselineSnapshot !== undefined
    );

    const newEntry: OutboxEntry = {
      opId,
      idempotencyKey,
      resource: params.resource,
      docId: params.docId,
      operationType: methodToOperationType(params.method),
      method: params.method,
      endpoint: params.endpoint,
      payload: params.payload ? JSON.parse(JSON.stringify(params.payload)) : null,
      baselineSnapshot:
        earlierPendingForDoc?.baselineSnapshot !== undefined
          ? earlierPendingForDoc.baselineSnapshot
          : params.baselineSnapshot !== undefined
            ? params.baselineSnapshot
              ? JSON.parse(JSON.stringify(params.baselineSnapshot))
              : null
            : undefined,
      timestamp: nowIso,
      timestampMs: nowMs,
      status: "pending",
      attempts: 0,
    };

    entries.push(newEntry);
    writePersistedEntries(entries);
    return newEntry;
  },

  markSynced(opId: string): OutboxEntry | null {
    const entries = readPersistedEntries();
    const idx = entries.findIndex((e) => e.opId === opId);
    const current = idx !== -1 ? entries[idx] : undefined;
    if (!current) return null;

    const updated: OutboxEntry = {
      ...current,
      status: "synced",
      attempts: current.attempts + 1,
      syncedAt: new Date().toISOString(),
      conflictInfo: undefined,
      lastError: undefined,
    };
    entries[idx] = updated;
    writePersistedEntries(entries);
    return updated;
  },

  markConflict(opId: string, conflictInfo: OutboxConflictInfo): OutboxEntry | null {
    const entries = readPersistedEntries();
    const idx = entries.findIndex((e) => e.opId === opId);
    const current = idx !== -1 ? entries[idx] : undefined;
    if (!current) return null;

    const updated: OutboxEntry = {
      ...current,
      status: "conflict",
      attempts: current.attempts + 1,
      conflictInfo,
    };
    entries[idx] = updated;
    writePersistedEntries(entries);
    return updated;
  },

  markFailedAttempt(opId: string, errorMessage: string): OutboxEntry | null {
    const entries = readPersistedEntries();
    const idx = entries.findIndex((e) => e.opId === opId);
    const current = idx !== -1 ? entries[idx] : undefined;
    if (!current) return null;

    const updated: OutboxEntry = {
      ...current,
      status: "pending",
      attempts: current.attempts + 1,
      lastError: errorMessage,
    };
    entries[idx] = updated;
    writePersistedEntries(entries);
    return updated;
  },

  clearAll(): void {
    inMemoryOutbox = [];
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(OUTBOX_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  },
};
