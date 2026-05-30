import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const repoName =
  process.env.PAGES_REPO_NAME ??
  process.env.GITHUB_REPOSITORY?.split("/").at(-1) ??
  "AI-Team-Optimizer";

const basePath = process.env.BASE_PATH ?? `/${repoName}/`;
const docsDir = path.join(workspaceRoot, "docs");
const nodeBinDir = path.dirname(process.execPath);
const localCorepackJs = path.join(
  nodeBinDir,
  "node_modules",
  "corepack",
  "dist",
  "corepack.js",
);
const useCorepackJs = existsSync(localCorepackJs);
const command = useCorepackJs
  ? process.execPath
  : process.platform === "win32"
    ? "pnpm.cmd"
    : "pnpm";
const args = [
  ...(useCorepackJs ? [localCorepackJs, "pnpm"] : []),
  "--filter",
  "@workspace/team-optimizer",
  "run",
  "build",
];

const result = spawnSync(
  command,
  args,
  {
    cwd: workspaceRoot,
    stdio: "inherit",
    shell: process.platform === "win32" && !useCorepackJs,
    env: {
      ...process.env,
      BASE_PATH: basePath,
      VITE_OUT_DIR: "../../docs",
      VITE_STATIC_DEMO: "true",
    },
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

mkdirSync(docsDir, { recursive: true });
copyFileSync(path.join(docsDir, "index.html"), path.join(docsDir, "404.html"));
writeFileSync(path.join(docsDir, ".nojekyll"), "");

console.log(`GitHub Pages build ready in ${path.relative(workspaceRoot, docsDir)}`);
console.log(`Base path: ${basePath}`);
