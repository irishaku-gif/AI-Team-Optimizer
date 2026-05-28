import { spawn } from "node:child_process";

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const storageMode = process.env.STORAGE_MODE ?? "memory";
const apiPort = process.env.API_PORT ?? process.env.PORT ?? "3001";
const webPort = process.env.WEB_PORT ?? "5173";
const apiTarget = process.env.API_PROXY_TARGET ?? `http://127.0.0.1:${apiPort}`;

const processes = [
  {
    name: "api",
    args: ["--filter", "@workspace/api-server", "run", "dev"],
    env: {
      NODE_ENV: "development",
      PORT: apiPort,
      STORAGE_MODE: storageMode,
    },
  },
  {
    name: "web",
    args: ["--filter", "@workspace/team-optimizer", "run", "dev"],
    env: {
      NODE_ENV: "development",
      PORT: webPort,
      BASE_PATH: "/",
      API_PROXY_TARGET: apiTarget,
    },
  },
];

const children = processes.map(({ name, args, env }) => {
  const child = spawn(pnpm, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${name}] stopped by ${signal}`);
      return;
    }

    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`API: http://127.0.0.1:${apiPort}`);
console.log(`Web: http://127.0.0.1:${webPort}`);
console.log(`Storage: ${storageMode}`);
