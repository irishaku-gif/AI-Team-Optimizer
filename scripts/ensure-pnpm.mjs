import { unlink } from "node:fs/promises";

const userAgent = process.env.npm_config_user_agent ?? "";

await Promise.allSettled([
  unlink("package-lock.json"),
  unlink("yarn.lock"),
]);

if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead of npm or yarn.");
  process.exit(1);
}
