import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  WORKSPACE_ROOT,
  checkHttpReachable,
  readServicePidFile,
  removeServicePidFile,
  stopWorkspaceService,
  writeServicePidFile,
} from "./process-tracker.mjs";

const __filename = fileURLToPath(import.meta.url);

export const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 5173);
export const FRONTEND_HEALTH_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

export function checkFrontendRunning(timeoutMs = 800) {
  return checkHttpReachable(FRONTEND_HEALTH_URL, timeoutMs);
}

export async function waitForFrontend(maxWaitMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const ready = await checkFrontendRunning(600);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

export function spawnFrontendChild({ extraArgs = [], stdio = "inherit" } = {}) {
  const viteBin = path.join(WORKSPACE_ROOT, "node_modules", "vite", "bin", "vite.js");

  const child = spawn(process.execPath, [viteBin, "dev", ...extraArgs], {
    cwd: WORKSPACE_ROOT,
    stdio,
    env: { ...process.env },
  });

  writeServicePidFile("frontend", {
    wrapperPid: process.pid,
    childPid: child.pid,
    port: FRONTEND_PORT,
    startedAt: new Date().toISOString(),
  });

  return child;
}

export async function stopFrontend() {
  const record = readServicePidFile("frontend");
  const runningBefore = await checkFrontendRunning(400);

  const stoppedPids = stopWorkspaceService("frontend", {
    expectedTokens: ["vite", "frontend.mjs"],
    workspaceMarkers: [WORKSPACE_ROOT],
    fallbackCommandMatchers: ["vite/bin/vite.js", "scripts/frontend.mjs"],
  });

  const startWait = Date.now();
  while (Date.now() - startWait < 4000) {
    const stillRunning = await checkFrontendRunning(300);
    if (!stillRunning) break;
    await new Promise((r) => setTimeout(r, 150));
  }

  if (stoppedPids.length > 0 || runningBefore || record) {
    console.log(
      `[frontend] Stopped workspace Vite dev server${
        stoppedPids.length > 0 ? ` (PIDs: ${stoppedPids.join(", ")})` : ""
      }.`
    );
  } else {
    console.log("[frontend] Vite dev server is not currently running for this workspace.");
  }
}

export async function startFrontendStandalone(extraArgs = []) {
  const alreadyRunning = await checkFrontendRunning();
  if (alreadyRunning && !extraArgs.includes("--port")) {
    const existing = readServicePidFile("frontend");
    console.log(
      `[frontend] Vite dev server is already running at http://localhost:${FRONTEND_PORT} (and http://127.0.0.1:${FRONTEND_PORT})${
        existing?.childPid ? ` [PID ${existing.childPid}]` : ""
      }.`
    );
    return;
  }

  console.log(
    `[frontend] Starting Vite development server on http://localhost:${FRONTEND_PORT} ...`
  );

  const child = spawnFrontendChild({ extraArgs, stdio: "inherit" });
  let shuttingDown = false;

  const handleShutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\n[frontend] Stopping Vite development server...");
    try {
      if (child.pid && !child.killed) {
        child.kill("SIGTERM");
      }
    } catch {
      // Ignore
    }
    stopWorkspaceService("frontend", {
      expectedTokens: ["vite", "frontend.mjs"],
      workspaceMarkers: [WORKSPACE_ROOT],
      fallbackCommandMatchers: ["vite/bin/vite.js"],
    });
    process.exit(0);
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  child.on("exit", (code) => {
    removeServicePidFile("frontend");
    process.exit(code ?? 0);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const rawArgs = process.argv.slice(2);
  const firstArg = (rawArgs[0] || "").toLowerCase();
  if (firstArg === "stop") {
    await stopFrontend();
    process.exit(0);
  } else {
    const extraArgs = firstArg === "start" ? rawArgs.slice(1) : rawArgs;
    await startFrontendStandalone(extraArgs);
  }
}

