/**
 * Development-only timing helper for diagnosing slow data reads.
 * Keeps response data and customer identifiers out of the console output.
 */
export async function measureLoad<T>(
  label: string,
  load: () => Promise<T>,
): Promise<T> {
  if (!import.meta.env.DEV || typeof performance === "undefined") {
    return load();
  }

  const startedAt = performance.now();
  try {
    const result = await load();
    console.info(`[perf] ${label}: ${Math.round(performance.now() - startedAt)} ms`);
    return result;
  } catch (error) {
    const detail = getSafeErrorDetail(error);
    console.info(
      `[perf] ${label}: ${Math.round(performance.now() - startedAt)} ms (failed${detail ? `: ${detail}` : ""})`
    );
    throw error;
  }
}

function getSafeErrorDetail(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const record = error as { code?: unknown; status?: unknown; name?: unknown };
  const code = typeof record.code === "string" ? record.code : "";
  const status = typeof record.status === "number" ? String(record.status) : "";
  const name = typeof record.name === "string" && record.name !== "Error" ? record.name : "";
  return [code, status, name].filter(Boolean).join("/");
}
