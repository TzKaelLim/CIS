// Starts the design handbook (手冊) on http://127.0.0.1:4321, with Astro's telemetry
// and update check turned off.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HOST, launch } from './lib.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const cwd = join(root, 'apps/docs');

// The theme CSS is generated before Astro starts, because this script calls astro
// directly instead of going through the dev script of apps/docs.
const themeCss = join(cwd, 'scripts/theme-css.mjs');
if (existsSync(themeCss)) {
  const result = spawnSync(process.execPath, [themeCss], { cwd, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await launch({
  name: '手冊',
  cwd,
  port: 4321,
  pkg: 'astro',
  bin: 'astro',
  args: ['dev', '--host', HOST, '--port', '4321'],
  env: {
    ASTRO_TELEMETRY_DISABLED: '1',
    ASTRO_DISABLE_UPDATE_CHECK: 'true',
    // Astro 7 moves `astro dev` into the background when it detects an AI coding
    // agent; keep it in the foreground so it can be stopped by its PID.
    ASTRO_DEV_BACKGROUND: '0',
  },
});
