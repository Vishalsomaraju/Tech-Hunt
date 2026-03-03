// ============================================================================
// TECH HUNT — Logger Utility
// Structured logger that silences debug/info in production.
// ============================================================================

const IS_PROD = import.meta.env.PROD;

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, tag: string, ...args: unknown[]): void {
  if (IS_PROD && (level === "debug" || level === "info")) return;

  const prefix = `[${tag}]`;
  switch (level) {
    case "debug":
      console.debug(prefix, ...args);
      break;
    case "info":
      console.info(prefix, ...args);
      break;
    case "warn":
      console.warn(prefix, ...args);
      break;
    case "error":
      console.error(prefix, ...args);
      break;
  }
}

/** Create a scoped logger for a module / feature. */
export function createLogger(tag: string) {
  return {
    debug: (...args: unknown[]) => log("debug", tag, ...args),
    info: (...args: unknown[]) => log("info", tag, ...args),
    warn: (...args: unknown[]) => log("warn", tag, ...args),
    error: (...args: unknown[]) => log("error", tag, ...args),
  };
}
