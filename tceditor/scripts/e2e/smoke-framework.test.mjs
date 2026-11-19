// Locks how the demo smoke test (smoke-framework.mjs, run by pnpm smoke)
// counts its runs: a run that throws or whose browser cannot start fails, a
// run over the memory threshold fails, either one makes the script exit
// non-zero, and without a terminal every run still lasts its full duration
// (the memory chart is redrawn with cursor moves, which only a terminal has).
// The browser is a stand-in, so no Chrome is started.
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { smoke } from "./smoke-framework.mjs";

const MB = 1024 * 1024;

/** A setup() that hands out a fake browser whose page reports `memory` bytes. */
function fakeSetup(memory = 20 * MB) {
  const browsers = [];

  const setup = async () => {
    const browser = {
      closed: false,
      async close() {
        this.closed = true;
      },
    };
    const page = {
      async evaluate() {
        return memory;
      },
    };

    browsers.push(browser);

    return { browser, page };
  };

  return { setup, browsers };
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Never opened: the fake setup() ignores it
const URL = "about:blank";

describe("smoke()", () => {
  afterEach(() => {
    // smoke() sets the exit code of a failed run; don't fail this test file
    process.exitCode = undefined;
  });

  it("counts a run that throws as failed and sets a non-zero exit code", async () => {
    const { setup, browsers } = fakeSetup();
    const results = await smoke(
      [
        {
          label: "drop target missing",
          url: URL,
          run: async () => {
            throw new TypeError("Cannot read properties of null (reading 'x')");
          },
        },
        { label: "works", url: URL, run: async () => pause(50) },
      ],
      { duration: 0.3, setup }
    );

    assert.deepEqual(
      results.map(({ result }) => result.passed),
      [false, true]
    );
    assert.match(String(results[0].result.error), /reading 'x'/);
    assert.equal(process.exitCode, 1);
    assert.ok(browsers.every((browser) => browser.closed));
  });

  it("counts a run whose browser cannot start as failed", async () => {
    const results = await smoke(
      [{ label: "demo down", url: URL, run: async () => {} }],
      {
        duration: 0.3,
        setup: async () => {
          throw new Error("net::ERR_CONNECTION_REFUSED");
        },
      }
    );

    assert.equal(results[0].result.passed, false);
    assert.equal(process.exitCode, 1);
  });

  it("counts a run over the memory threshold as failed", async () => {
    const { setup } = fakeSetup(400 * MB);
    const results = await smoke(
      [{ label: "leaks", url: URL, run: async () => pause(20) }],
      { duration: 0.3, threshold: 300, setup }
    );

    assert.equal(results[0].result.memoryExceeded, true);
    assert.equal(results[0].result.passed, false);
    assert.equal(process.exitCode, 1);
  });

  it("runs for the full duration with the chart on when stdout is not a terminal", async (t) => {
    if (process.stdout.isTTY) {
      t.skip("stdout is a terminal here; node --test pipes it");
      return;
    }

    const { setup } = fakeSetup();
    const results = await smoke(
      [{ label: "chart", url: URL, run: async () => pause(50) }],
      { chart: true, duration: 1.6, setup }
    );

    assert.equal(results[0].result.passed, true);
    assert.equal(results[0].result.error, null);
    // The duration counts the 1 s the framework waits before the first run,
    // which leaves about 0.6 s of 50 ms runs: far more than one iteration
    assert.ok(
      results[0].result.iterations >= 5,
      `${results[0].result.iterations} iterations`
    );
    assert.equal(process.exitCode, undefined);
  });
});
