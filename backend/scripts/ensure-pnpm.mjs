import { unlink } from "node:fs/promises";

const userAgent = process.env.npm_config_user_agent ?? "";
const execPath = process.env.npm_execpath ?? "";

await Promise.allSettled([
  unlink("package-lock.json"),
  unlink("yarn.lock"),
]);

const isPnpm = userAgent.includes("pnpm") || execPath.includes("pnpm");
const isKnownWrongManager =
  userAgent.startsWith("npm/") || userAgent.startsWith("yarn/");

if (!isPnpm && isKnownWrongManager) {
  console.error("Use pnpm instead of npm or yarn.");
  process.exit(1);
}

if (!isPnpm) {
  console.warn("Package manager could not be detected; continuing.");
}
