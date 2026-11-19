// Starts the HeroUI Storybook (元件樣品室) on http://127.0.0.1:6007.
// The Storybook CLI writes ~/.storybook/settings.json; HOME points at the ignored
// heroui/storybook/.home/ so nothing outside the repo is written.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HOST, launch } from './lib.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const cwd = join(root, 'heroui/storybook');
const home = join(cwd, '.home');
mkdirSync(home, { recursive: true });

await launch({
  name: '元件樣品室',
  cwd,
  port: 6007,
  pkg: 'storybook',
  bin: 'storybook',
  args: [
    'dev',
    '--host',
    HOST,
    '--port',
    '6007',
    '--exact-port',
    '--no-open',
    '--ci',
    '--no-version-updates',
  ],
  env: { STORYBOOK_DISABLE_TELEMETRY: '1', HOME: home, USERPROFILE: home },
});
