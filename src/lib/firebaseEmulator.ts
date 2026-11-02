import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  inMemoryPersistence,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

export type DataSourceMode = "firebase" | "auto" | "emulator" | "json-server";

export interface EmulatorConfig {
  projectId: string;
  host: string;
  port: number;
  mode: DataSourceMode;
  authHost?: string;
  authPort?: number;
}

interface GlobalFirebaseEmulatorCache {
  app: FirebaseApp;
  db: Firestore;
  auth?: Auth;
  authConnected?: boolean;
  config: EmulatorConfig;
  connected: boolean;
}

const EMULATOR_APP_NAME = "sri-amman-emulator-only";
const EMULATOR_DUMMY_API_KEY = "demo-sri-amman-store-local-emulator-key";
const GLOBAL_CACHE_KEY = "__SASS_FIREBASE_EMULATOR_CACHE__";

function getGlobalCache(): Record<string, GlobalFirebaseEmulatorCache> {
  const g = globalThis as unknown as Record<string, Record<string, GlobalFirebaseEmulatorCache>>;
  if (!g[GLOBAL_CACHE_KEY]) {
    g[GLOBAL_CACHE_KEY] = {};
  }
  return g[GLOBAL_CACHE_KEY];
}

function readEnvVar(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key] !== undefined) {
    return String(import.meta.env[key]);
  }
  return undefined;
}

export function normalizeDataSourceMode(raw?: string): DataSourceMode {
  const clean = (raw || "").trim().toLowerCase();
  if (clean === "firebase" || clean === "production") return "firebase";
  if (clean === "emulator") return "emulator";
  if (clean === "json-server" || clean === "json_server" || clean === "jsonserver") {
    return "json-server";
  }
  return "auto";
}

export function resolveEmulatorConfig(overrides?: Partial<EmulatorConfig>): EmulatorConfig {
  const rawProjectId =
    overrides?.projectId ??
    readEnvVar("VITE_FIREBASE_EMULATOR_PROJECT_ID") ??
    readEnvVar("FIREBASE_EMULATOR_PROJECT_ID") ??
    (readEnvVar("VITE_FIREBASE_PROJECT_ID")?.startsWith("demo-") ? readEnvVar("VITE_FIREBASE_PROJECT_ID") : undefined) ??
    (readEnvVar("FIREBASE_PROJECT_ID")?.startsWith("demo-") ? readEnvVar("FIREBASE_PROJECT_ID") : undefined) ??
    "demo-sri-amman-store";

  let defaultHost = "127.0.0.1";
  let defaultPort = 8081;

  const combinedHostPort = readEnvVar("FIRESTORE_EMULATOR_HOST");
  if (combinedHostPort && combinedHostPort.includes(":")) {
    const [h, p] = combinedHostPort.split(":");
    if (h) defaultHost = h.trim();
    if (p && !Number.isNaN(Number(p))) defaultPort = Number(p);
  }

  const rawHost =
    overrides?.host ??
    readEnvVar("VITE_FIRESTORE_EMULATOR_HOST") ??
    defaultHost;

  const rawPort =
    overrides?.port ??
    (readEnvVar("VITE_FIRESTORE_EMULATOR_PORT")
      ? Number(readEnvVar("VITE_FIRESTORE_EMULATOR_PORT"))
      : defaultPort);

  let defaultAuthHost = "127.0.0.1";
  let defaultAuthPort = 9099;

  const combinedAuthHostPort = readEnvVar("FIREBASE_AUTH_EMULATOR_HOST");
  if (combinedAuthHostPort) {
    const stripped = combinedAuthHostPort.replace(/^https?:\/\//i, "").trim();
    if (stripped.includes(":")) {
      const [ah, ap] = stripped.split(":");
      if (ah) defaultAuthHost = ah.trim();
      if (ap && !Number.isNaN(Number(ap))) defaultAuthPort = Number(ap);
    }
  }

  const rawAuthHost =
    overrides?.authHost ??
    readEnvVar("VITE_FIREBASE_AUTH_EMULATOR_HOST") ??
    defaultAuthHost;

  const rawAuthPort =
    overrides?.authPort ??
    (readEnvVar("VITE_FIREBASE_AUTH_EMULATOR_PORT")
      ? Number(readEnvVar("VITE_FIREBASE_AUTH_EMULATOR_PORT"))
      : defaultAuthPort);

  const rawMode =
    overrides?.mode ??
    normalizeDataSourceMode(
      readEnvVar("VITE_DATA_SOURCE_MODE") ??
        readEnvVar("VITE_DATA_SOURCE") ??
        readEnvVar("DATA_SOURCE_MODE") ??
        readEnvVar("DATA_SOURCE")
    );

  return {
    projectId: rawProjectId.trim(),
    host: rawHost.trim(),
    port: Number(rawPort),
    authHost: rawAuthHost.trim(),
    authPort: Number(rawAuthPort),
    mode: rawMode,
  };
}

/**
 * Strictly validates that the Firebase configuration only targets a local emulator
 * and can never accidentally connect to Google Cloud production Firestore or Auth.
 */
export function assertEmulatorOnlyConfig(config: EmulatorConfig): void {
  if (!config.projectId || !config.projectId.startsWith("demo-")) {
    throw new Error(
      `Invalid Firebase projectId "${config.projectId}". Production Firebase connections are prohibited; projectId must use the emulator-only "demo-*" prefix (expected "demo-sri-amman-store").`
    );
  }

  if (
    !config.host ||
    config.host.toLowerCase().includes("googleapis.com") ||
    config.host.toLowerCase().includes("firebaseio.com")
  ) {
    throw new Error(
      `Invalid Firestore Emulator host "${config.host}". Refusing to connect to production Firebase host.`
    );
  }

  if (!Number.isInteger(config.port) || config.port <= 0 || config.port > 65535) {
    throw new Error(
      `Invalid Firestore Emulator port "${config.port}". Expected a valid local TCP port such as 8081.`
    );
  }

  if (config.authHost !== undefined) {
    const cleanAuthHost = config.authHost.toLowerCase().trim();
    if (
      !cleanAuthHost ||
      cleanAuthHost.includes("googleapis.com") ||
      cleanAuthHost.includes("firebaseio.com") ||
      cleanAuthHost.includes("firebaseapp.com") ||
      (cleanAuthHost !== "127.0.0.1" &&
        cleanAuthHost !== "localhost" &&
        cleanAuthHost !== "::1")
    ) {
      throw new Error(
        `Invalid Auth Emulator host "${config.authHost}". Refusing to connect to non-local or production Firebase Auth host.`
      );
    }
  }

  if (config.authPort !== undefined) {
    if (
      !Number.isInteger(config.authPort) ||
      config.authPort <= 0 ||
      config.authPort > 65535
    ) {
      throw new Error(
        `Invalid Auth Emulator port "${config.authPort}". Expected a valid local TCP port such as 9099.`
      );
    }
  }
}

/**
 * Initializes the emulator-only Firebase app and Firestore instance at most once
 * per configuration key, preserving state across Vite HMR and SSR module reloads.
 */
export function getEmulatorFirestore(
  overrides?: Partial<EmulatorConfig>
): GlobalFirebaseEmulatorCache {
  const config = resolveEmulatorConfig(overrides);
  assertEmulatorOnlyConfig(config);

  const cacheKey = `${config.projectId}@${config.host}:${config.port}`;
  const cache = getGlobalCache();

  if (cache[cacheKey] && cache[cacheKey].connected) {
    return {
      ...cache[cacheKey],
      config,
    };
  }

  const appName =
    cacheKey === "demo-sri-amman-store@127.0.0.1:8081"
      ? EMULATOR_APP_NAME
      : `${EMULATOR_APP_NAME}-${cacheKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  const existingApps = getApps();
  const appAlreadyExists = existingApps.some((a) => a.name === appName);
  const app = appAlreadyExists
    ? getApp(appName)
    : initializeApp(
        {
          projectId: config.projectId,
          apiKey: EMULATOR_DUMMY_API_KEY,
          authDomain: `${config.projectId}.firebaseapp.com`,
        },
        appName
      );

  let db: Firestore;
  try {
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
  } catch {
    db = getFirestore(app);
  }

  if (!cache[cacheKey]?.connected) {
    try {
      connectFirestoreEmulator(db, config.host, config.port);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignore only if Firestore was already connected to the same emulator during HMR
      if (!msg.toLowerCase().includes("already been started")) {
        throw err;
      }
    }
  }

  const entry: GlobalFirebaseEmulatorCache = {
    app,
    db,
    config,
    connected: true,
  };

  cache[cacheKey] = entry;
  return entry;
}

/**
 * Initializes and connects the Firebase Authentication instance strictly to the
 * local Firebase Authentication Emulator (`127.0.0.1:9099` by default).
 * Never connects to production Firebase Authentication endpoints.
 */
export function getEmulatorAuth(overrides?: Partial<EmulatorConfig>): {
  app: FirebaseApp;
  auth: Auth;
  config: EmulatorConfig;
  authEmulatorUrl: string;
} {
  const config = resolveEmulatorConfig(overrides);
  assertEmulatorOnlyConfig(config);

  const authHost = config.authHost ?? "127.0.0.1";
  const authPort = config.authPort ?? 9099;
  const authEmulatorUrl = `http://${authHost}:${authPort}`;

  const firestoreEntry = getEmulatorFirestore(config);
  const cacheKey = `${config.projectId}@${config.host}:${config.port}`;
  const cache = getGlobalCache();
  const cached = cache[cacheKey] ?? firestoreEntry;

  if (cached.auth && cached.authConnected) {
    return {
      app: cached.app,
      auth: cached.auth,
      config,
      authEmulatorUrl,
    };
  }

  let auth: Auth;
  try {
    auth = initializeAuth(cached.app, {
      persistence:
        typeof window !== "undefined"
          ? browserLocalPersistence
          : inMemoryPersistence,
    });
  } catch {
    auth = getAuth(cached.app);
  }

  if (!cached.authConnected) {
    try {
      connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes("already")) {
        throw err;
      }
    }
  }

  cached.auth = auth;
  cached.authConnected = true;
  cache[cacheKey] = cached;

  return {
    app: cached.app,
    auth,
    config,
    authEmulatorUrl,
  };
}

export function getEmulatorHttpBaseUrl(overrides?: Partial<EmulatorConfig>): string {
  const config = resolveEmulatorConfig(overrides);
  assertEmulatorOnlyConfig(config);
  return `http://${config.host}:${config.port}`;
}

export function getAuthEmulatorHttpBaseUrl(overrides?: Partial<EmulatorConfig>): string {
  const config = resolveEmulatorConfig(overrides);
  assertEmulatorOnlyConfig(config);
  const authHost = config.authHost ?? "127.0.0.1";
  const authPort = config.authPort ?? 9099;
  return `http://${authHost}:${authPort}`;
}


