import asciichart from "asciichart";
import { pause } from "./utils/pause.mjs";
import { setup as launchBrowser } from "./utils/setup.mjs";

const CHART = false;
const CHART_HEIGHT = 15;
const DURATION = 60;
const THRESHOLD = 300;
const MB = 1024 * 1024;
// How often a run prints its progress when stdout is not a terminal
const LOG_INTERVAL_MS = 30_000;

// Redrawing the progress line and the memory chart moves the cursor, which
// only a terminal can do: without one (output piped or redirected to a file)
// process.stdout.moveCursor is undefined, so the progress is printed as plain
// lines instead.
const isTerminal = () => process.stdout.isTTY === true;

const execute = async (test) => {
  const {
    duration = DURATION,
    threshold = THRESHOLD,
    chart = CHART,
    chartHeight = CHART_HEIGHT,
    puppeteerOptions,
    // Tests pass a stand-in for the browser
    setup = launchBrowser,
  } = test;

  const terminal = isTerminal();
  const drawChart = chart && terminal;

  if (drawChart || !terminal) {
    console.log(
      "\x1b[36m%s\x1b[0m",
      ` ╭ ${test.label} (duration: ${duration}s, threshold: ${threshold} MB)`
    );
  }

  const timeout = duration * 1000;
  const memoryThreshold = threshold * MB;

  let memoryUsage;

  const memoryData = [50];

  const clearLines = (n) => {
    for (let i = 0; i < n; i++) {
      const y = i === 0 ? null : -1;
      process.stdout.moveCursor(0, y);
      process.stdout.clearLine(1);
    }
    process.stdout.cursorTo(0);
  };

  let plotted = false;
  let lastLogged = 0;
  let timeElapsedHuman = 0;
  let iterations = 0;

  const progress = () =>
    `${(memoryUsage / MB).toFixed(
      2
    )} MB (${timeElapsedHuman}s, ${iterations} iterations)`;

  const plot = (last = false) => {
    if (!terminal) {
      if (last || Date.now() - lastLogged >= LOG_INTERVAL_MS) {
        console.log(` ├ ${test.label}: ${progress()}`);
        lastLogged = Date.now();
      }
    } else if (drawChart) {
      if (memoryData.length > 0) {
        if (plotted) {
          clearLines(chartHeight + 2);
        }

        process.stdout.write(
          ` │ ${asciichart
            .plot(memoryData, { height: chartHeight })
            .replace(/\n/gm, "\n │ ")}`
        );

        process.stdout.write(`\n ╰ ${progress()} `);
      }
    } else {
      if (plotted) {
        clearLines(1);
      }

      process.stdout.write(` ├ ${test.label}: ${progress()} `);
    }

    plotted = true;
  };

  let browser;
  let memoryExceeded = false;
  // A run that throws (a selector that matches nothing, a page that does not
  // load) fails, like a run over the memory threshold
  let error = null;

  try {
    let page;

    ({ browser, page } = await setup(test.url, puppeteerOptions));

    const start = Date.now();

    await pause(1000);

    while (true) {
      iterations += 1;

      const timeElapsed = Date.now() - start;
      timeElapsedHuman = ((Date.now() - start) / 1000).toFixed(2);

      await test.run(page);

      memoryUsage = await page.evaluate(
        () => performance.memory.usedJSHeapSize
      );

      memoryData.push((memoryUsage / MB).toFixed(2));

      plot();

      if (memoryUsage > memoryThreshold) {
        memoryExceeded = true;

        console.error(
          `❌ Test failed. Memory usage exceeded ${threshold} MB threshold in ${timeElapsedHuman}s.`
        );

        break;
      }

      if (timeElapsed > timeout) {
        break;
      }
    }

    if (!memoryExceeded) {
      plot(true);

      console.log(`✅ Test successful.`);
    }
  } catch (err) {
    error = err;

    if (plotted && terminal) process.stdout.write("\n");

    console.error(
      `❌ Test failed. Error during smoke test after ${iterations} iteration(s):`,
      err
    );
  } finally {
    try {
      await browser?.close();
    } catch (err) {
      error ??= err;
      console.error("❌ Test failed. Could not close the browser:", err);
    }
  }

  return {
    memoryUsage,
    memoryExceeded,
    error,
    passed: error === null && !memoryExceeded,
    timeElapsedHuman,
    memoryData,
    iterations,
  };
};

/**
 * Runs each test in turn and prints how many passed. When one failed (it
 * threw or exceeded the memory threshold), sets process.exitCode to 1, so the
 * script exits non-zero once the browsers are closed. Returns the results.
 */
export const smoke = async (tests, config) => {
  console.log(`Beginning smoke tests...`);
  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];

    results.push({
      test,
      result: await execute({ ...config, ...test }),
    });
  }

  const failed = results.filter(({ result }) => !result.passed);

  console.log(
    `${results.length - failed.length}/${results.length} tests passed`
  );

  for (const { test, result } of failed) {
    console.error(
      `  failed: ${test.label} (${
        result.memoryExceeded ? "memory over the threshold" : "error"
      })`
    );
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }

  return results;
};
