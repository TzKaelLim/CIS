// Shared helpers for the local preview launchers (storybook.mjs, docs.mjs, astro.mjs).
// They avoid lsof, shell environment prefixes and node_modules/.bin, so the same
// commands work on macOS, Linux and Windows.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import net from 'node:net';
import { join, resolve } from 'node:path';

export const HOST = '127.0.0.1';

const CONNECT_TIMEOUT_MS = 300;

/** Resolves true when something accepts a TCP connection on host:port. */
function canConnect(port, host) {
  return new Promise((done) => {
    const socket = net.connect({ port, host });
    const finish = (result) => {
      socket.destroy();
      done(result);
    };
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

/** Resolves true when this process can listen on host:port. */
function canListen(port, host) {
  return new Promise((done) => {
    const server = net.createServer();
    server.once('error', () => done(false));
    server.listen({ port, host, exclusive: true }, () => server.close(() => done(true)));
  });
}

/**
 * Whether nobody uses the port. Binding alone is not enough: macOS sets SO_REUSEADDR,
 * so binding 127.0.0.1 still succeeds while another server listens on 0.0.0.0, :: or
 * ::1. A connection attempt to 127.0.0.1 and ::1 catches those first.
 */
export async function checkPortFree(port, host = HOST) {
  const connected = await Promise.all([canConnect(port, '127.0.0.1'), canConnect(port, '::1')]);
  if (connected.some(Boolean)) return false;
  return canListen(port, host);
}

/**
 * The absolute path of the JS file that the `bin` entry `bin` of package `pkg`, installed
 * in `<pkgDir>/node_modules`, points to. `bin` in package.json may be a string or an object.
 */
export function resolveBin(pkgDir, pkg, bin) {
  const pkgRoot = join(pkgDir, 'node_modules', pkg);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
  } catch {
    throw new Error(`找不到 ${pkg}，請先執行 pnpm install`);
  }
  const entry = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[bin];
  if (typeof entry !== 'string') {
    throw new Error(`找不到 ${pkg} 的 ${bin} 指令，請先執行 pnpm install`);
  }
  return resolve(pkgRoot, entry);
}

/**
 * Starts the CLI `bin` of package `pkg` with node, after checking that `port` is free.
 * Forwards SIGINT and SIGTERM to it and exits with its exit code.
 */
export async function launch({ name, cwd, port, pkg, bin, args, env = {} }) {
  if (!(await checkPortFree(port))) {
    console.error(
      `埠 ${port} 已被占用，所以沒有啟動${name}。請先停掉占用它的程序（如果是你開的），再重跑一次。`,
    );
    process.exit(1);
  }
  let file;
  try {
    file = resolveBin(cwd, pkg, bin);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  const child = spawn(process.execPath, [file, ...args], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (child.exitCode === null && child.signalCode === null) child.kill(signal);
    });
  }
  return new Promise(() => {
    child.once('error', (error) => {
      console.error(error.message);
      process.exit(1);
    });
    child.once('exit', (code, signal) => {
      process.exit(code ?? (signal ? 1 : 0));
    });
  });
}
