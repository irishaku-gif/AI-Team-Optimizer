export type StorageMode = "memory" | "postgres";

export interface AppConfig {
  port: number;
  storageMode: StorageMode;
  apiProxyTarget?: string;
}

function parsePort(value: string | undefined, fallback: number): number {
  const port = Number(value ?? fallback);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${value}"`);
  }

  return port;
}

function resolveStorageMode(): StorageMode {
  const raw = process.env.STORAGE_MODE ?? process.env.DATA_STORE;

  if (raw === "memory" || raw === "postgres") {
    return raw;
  }

  if (raw) {
    throw new Error(`Invalid storage mode: "${raw}". Use "memory" or "postgres".`);
  }

  return process.env.DATABASE_URL ? "postgres" : "memory";
}

export function loadConfig(): AppConfig {
  return {
    port: parsePort(process.env.PORT, 3001),
    storageMode: resolveStorageMode(),
    apiProxyTarget: process.env.API_PROXY_TARGET,
  };
}
