type LogLevel = "debug" | "log" | "warn" | "error";

export interface Logger {
  debug: (...args: any[]) => void;
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export function createLogger(prefix?: string): Logger {
  const _log = (level: LogLevel, ...args: any[]) => {
    const base = [
      ["debug"].includes(level) ? "" : "[Zotero MetaFlow]",
      prefix ? `[${prefix}]` : "",
    ].filter(Boolean).join(" ");

    const data = base ? [base, ...args] : args;

    switch (level) {
      case "debug":
        Zotero.debug(data.join(" "));
        break;
      case "log":
      case "warn":
      case "error":{
        Zotero.debug(data.join(" "));
        try {
          const win = ztoolkit.getGlobal("window");
          if (!win.closed)
            win.console[level](...data);
        }
        catch {
          // The host log above remains available after the last window closes.
        }
        break;
      }
    }
  };

  return {
    debug: (...args: any[]) => _log("debug", ...args),
    log: (...args: any[]) => _log("log", ...args),
    warn: (...args: any[]) => _log("warn", ...args),
    error: (...args: any[]) => _log("error", ...args),
  };
}

export const logger = createLogger();
