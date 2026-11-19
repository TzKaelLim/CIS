// Runs the astro CLI of apps/docs with the given arguments (for example `build`),
// with Astro's telemetry and update check turned off. It does not check any port.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveBin } from './lib.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const cwd = join(root, 'apps/docs');

let astro;
try {
  astro = resolveBin(cwd, 'astro', 'astro');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const result = spawnSync(process.execPath, [astro, ...process.argv.slice(2)], {
  cwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: '1',
    ASTRO_DISABLE_UPDATE_CHECK: 'true',
    ASTRO_DEV_BACKGROUND: '0',
  },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
