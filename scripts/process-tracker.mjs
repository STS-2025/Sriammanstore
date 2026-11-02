import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const WORKSPACE_ROOT = path.resolve(__dirname, "..");
export const PID_DIR = path.join(WORKSPACE_ROOT, ".dev-pids");

function ensurePidDir() {
  if (!fs.existsSync(PID_DIR)) {
    fs.mkdirSync(PID_DIR, { recursive: true });
  }
}

export function getServicePidFilePath(serviceName) {
  return path.join(PID_DIR, `${serviceName}.json`);
}

export function writeServicePidFile(serviceName, data) {
  try {
    ensurePidDir();
    const payload = {
      service: serviceName,
      workspaceRoot: WORKSPACE_ROOT,
      updatedAt: new Date().toISOString(),
      ...data,
    };
    fs.writeFileSync(
      getServicePidFilePath(serviceName),
      JSON.stringify(payload, null, 2),
      "utf-8"
    );
  } catch {
    // Non-fatal if pid directory cannot be written
  }
}

export function readServicePidFile(serviceName) {
  try {
    const filePath = getServicePidFilePath(serviceName);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function removeServicePidFile(serviceName) {
  try {
    const filePath = getServicePidFilePath(serviceName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}

export function isProcessAlive(pid) {
  if (!pid || typeof pid !== "number" || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === "EPERM";
  }
}

export function checkHttpReachable(url, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 500));
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

export function checkTcpPortOpen(host, port, timeoutMs = 600) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (open) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

/**
 * Queries running processes on Windows using Win32_Process so we can verify
 * process identity (CommandLine, Name, ParentProcessId) and never kill unrelated
 * processes by port number or broad image name.
 */
function listWindowsProcesses() {
  const psScript = `
    $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Select-Object ProcessId, ParentProcessId, Name, CommandLine
    $procs | ConvertTo-Json -Compress
  `;
  const res = spawnSync("powershell.exe", ["-NoProfile", "-Command", psScript], {
    cwd: WORKSPACE_ROOT,
    encoding: "utf-8",
    windowsHide: true,
  });
  if (res.status !== 0 || !res.stdout) return [];
  const trimmed = res.stdout.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function collectAncestorPids(selfPid, allProcs) {
  const parentByChild = new Map();
  for (const proc of allProcs) {
    parentByChild.set(Number(proc.ProcessId), Number(proc.ParentProcessId));
  }
  const protectedPids = new Set([selfPid, process.ppid]);
  let cur = selfPid;
  while (cur && parentByChild.has(cur)) {
    const parent = parentByChild.get(cur);
    if (!parent || protectedPids.has(parent)) break;
    protectedPids.add(parent);
    cur = parent;
  }
  return protectedPids;
}

function collectDescendantPids(rootPids, allProcs, protectedPids) {
  const childrenByParent = new Map();
  for (const proc of allProcs) {
    const ppid = Number(proc.ParentProcessId);
    const pid = Number(proc.ProcessId);
    if (!childrenByParent.has(ppid)) {
      childrenByParent.set(ppid, []);
    }
    childrenByParent.get(ppid).push(pid);
  }

  const ordered = [];
  const visited = new Set();

  function dfs(pid) {
    if (!pid || visited.has(pid) || protectedPids.has(pid)) return;
    visited.add(pid);
    const children = childrenByParent.get(pid) || [];
    for (const childPid of children) {
      dfs(childPid);
    }
    ordered.push(pid); // Children pushed before parent
  }

  for (const rPid of rootPids) {
    dfs(Number(rPid));
  }
  return ordered;
}

/**
 * Stops only the process tree belonging to a specific workspace service.
 *
 * Safety guarantees:
 * - Never kills processes based solely on TCP port number.
 * - Never runs broad `taskkill /IM node.exe` or `taskkill /IM java.exe`.
 * - Never kills the current stop process or any of its parent/caller processes.
 * - Verifies recorded PIDs against expected command-line tokens before stopping.
 * - Walks child processes (children first, then parents) so no orphaned processes remain.
 */
export function stopWorkspaceService(
  serviceName,
  {
    expectedTokens = [],
    workspaceMarkers = [WORKSPACE_ROOT],
    fallbackCommandMatchers = [],
  } = {}
) {
  const selfPid = process.pid;
  const record = readServicePidFile(serviceName);
  const candidateRootPids = new Set();

  if (process.platform === "win32") {
    const allProcs = listWindowsProcesses();
    const protectedPids = collectAncestorPids(selfPid, allProcs);
    const procById = new Map(allProcs.map((p) => [Number(p.ProcessId), p]));

    const matchesExpectedToken = (proc) => {
      if (!proc) return false;
      const cmd = String(proc.CommandLine || "").toLowerCase();
      const name = String(proc.Name || "").toLowerCase();
      if (expectedTokens.length === 0) return true;
      return expectedTokens.some(
        (tok) =>
          cmd.includes(String(tok).toLowerCase()) ||
          name.includes(String(tok).toLowerCase())
      );
    };

    if (record) {
      for (const recordedPid of [record.childPid, record.wrapperPid]) {
        const pidNum = Number(recordedPid);
        if (!pidNum || protectedPids.has(pidNum)) continue;
        const proc = procById.get(pidNum);
        if (proc && matchesExpectedToken(proc)) {
          candidateRootPids.add(pidNum);
        }
      }
    }

    // Fallback: locate processes whose CommandLine explicitly references this workspace
    // and matches the service-specific startup command signature.
    const normalizedMarkers = workspaceMarkers.map((m) =>
      String(m).toLowerCase().replace(/\\/g, "/")
    );
    for (const proc of allProcs) {
      const pidNum = Number(proc.ProcessId);
      if (!pidNum || protectedPids.has(pidNum)) continue;
      const normalizedCmd = String(proc.CommandLine || "")
        .toLowerCase()
        .replace(/\\/g, "/");
      if (!normalizedCmd) continue;

      const belongsToWorkspace = normalizedMarkers.some((marker) =>
        normalizedCmd.includes(marker)
      );
      if (!belongsToWorkspace) continue;

      const matchesFallback =
        fallbackCommandMatchers.length > 0 &&
        fallbackCommandMatchers.some((matcher) => {
          if (typeof matcher === "function") {
            return matcher(normalizedCmd, proc);
          }
          return normalizedCmd.includes(String(matcher).toLowerCase().replace(/\\/g, "/"));
        });

      if (matchesFallback) {
        candidateRootPids.add(pidNum);
      }
    }

    const pidsToStop = collectDescendantPids(
      Array.from(candidateRootPids),
      allProcs,
      protectedPids
    );

    if (pidsToStop.length > 0) {
      const pidList = pidsToStop.join(", ");
      const stopScript = `
        foreach ($id in @(${pidList})) {
          if ($id -ne $PID) {
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
          }
        }
      `;
      spawnSync("powershell.exe", ["-NoProfile", "-Command", stopScript], {
        cwd: WORKSPACE_ROOT,
        stdio: "ignore",
        windowsHide: true,
      });
    }

    removeServicePidFile(serviceName);
    return pidsToStop;
  }

  // POSIX handling
  const stopped = [];
  if (record) {
    for (const pid of [record.childPid, record.wrapperPid]) {
      const pidNum = Number(pid);
      if (pidNum && pidNum !== selfPid && isProcessAlive(pidNum)) {
        try {
          process.kill(pidNum, "SIGTERM");
          stopped.push(pidNum);
        } catch {
          // Ignore
        }
      }
    }
  }
  removeServicePidFile(serviceName);
  return stopped;
}

