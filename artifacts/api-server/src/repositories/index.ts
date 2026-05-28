import type { StorageMode } from "../config";
import type { AppRepositories } from "./types";
import { createMemoryRepositories } from "./memory";
import { createPostgresRepositories } from "./postgres";

export function createRepositories(mode: StorageMode): AppRepositories {
  if (mode === "postgres") {
    return createPostgresRepositories();
  }

  return createMemoryRepositories();
}
