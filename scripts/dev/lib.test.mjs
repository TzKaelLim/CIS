import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkPortFree, resolveBin } from './lib.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));

/** Listens on host, or returns null when this computer cannot bind it (no IPv6). */
async function listenOn(host) {
  const server = net.createServer();
  try {
    server.listen(0, host);
    await once(server, 'listening');
    return server;
  } catch {
    server.close();
    return null;
  }
}

test('checkPortFree is false while another server listens on the port', async () => {
  const server = net.createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    assert.equal(await checkPortFree(server.address().port), false);
  } finally {
    server.close();
  }
});

test('checkPortFree is true for a port nobody listens on', async () => {
  const server = net.createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  assert.equal(await checkPortFree(port), true);
});

for (const host of ['0.0.0.0', '::', '::1']) {
  test(`checkPortFree is false while a server listens on ${host}`, async (t) => {
    const server = await listenOn(host);
    if (!server) {
      t.skip(`this computer cannot listen on ${host}`);
      return;
    }
    try {
      assert.equal(await checkPortFree(server.address().port), false);
    } finally {
      server.close();
    }
  });
}

test('resolveBin returns the JS entry of the Storybook CLI', () => {
  const file = resolveBin(join(root, 'heroui/storybook'), 'storybook', 'storybook');
  assert.ok(isAbsolute(file) && existsSync(file), file);
});

test('resolveBin names pnpm install when the package is missing', () => {
  assert.throws(() => resolveBin(root, 'no-such-package', 'x'), /pnpm install/);
});
