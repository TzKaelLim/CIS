// Runs the Storybook CLI for the block Storybook.
//
//   node scripts/storybook.mjs dev     serve on http://127.0.0.1:6010
//   node scripts/storybook.mjs build   write storybook-static/
//
// The CLI writes ~/.storybook/settings.json, so it runs with HOME pointed at
// apps/storybook/.home (git-ignored). Only the CLI gets that HOME; puppeteer
// (pnpm storybook:smoke) needs the real one to find its browser.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const PORT = 6010;

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = join(appDir, ".home");
const cli = join(appDir, "node_modules", ".bin", "storybook");

/** The lsof lines for a listener on the port, "" when free, null without lsof. */
function listenerOn(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  if (result.error) return null;
  return result.status === 0 ? result.stdout.trim() : "";
}

const mode = process.argv[2];
let args;
if (mode === "dev") {
  const listener = listenerOn(PORT);
  if (listener) {
    console.error(
      `Port ${PORT} is already in use, so the block Storybook was not started:\n` +
        `${listener}\n` +
        "Stop that process (if it is yours) and run the command again."
    );
    process.exit(1);
  }
  args = [
    "dev",
    "--host",
    HOST,
    "--port",
    String(PORT),
    // Without lsof the check above is skipped; this still refuses a taken port
    // instead of moving to another one.
    "--exact-port",
    "--no-open",
    "--ci",
    // Skip the daily request to storybook.js.org/versions.json.
    "--no-version-updates",
  ];
} else if (mode === "build") {
  args = ["build", "--output-dir", "storybook-static"];
} else {
  console.error("Usage: node scripts/storybook.mjs <dev|build>");
  process.exit(2);
}

mkdirSync(home, { recursive: true });
const child = spawn(cli, args, {
  cwd: appDir,
  stdio: "inherit",
  env: { ...process.env, HOME: home, STORYBOOK_DISABLE_TELEMETRY: "1" },
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(`Could not run ${cli}: ${error.message}. Run pnpm install.`);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
