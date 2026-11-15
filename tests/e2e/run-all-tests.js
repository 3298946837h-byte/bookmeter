#!/usr/bin/env node
/**
 * Unified E2E Test Suite Runner for BookMeter
 * Supports running all 4 tiers (90 tests total) or individual tiers via CLI flags.
 * Usage:
 *   node tests/e2e/run-all-tests.js
 *   node tests/e2e/run-all-tests.js --tier 1
 *   node tests/e2e/run-all-tests.js --tier 2
 *   node tests/e2e/run-all-tests.js --tier 3
 *   node tests/e2e/run-all-tests.js --tier 4
 *   node tests/e2e/run-all-tests.js --bail
 *   node tests/e2e/run-all-tests.js --base-url http://127.0.0.1:5000
 */

const {
  TestClient,
  assert,
  assertEqual,
  assertStatus,
  assertMagicBytes,
  assertContentDisposition,
  isServerRunning,
  startServerIfNotRunning,
  stopServerIfSpawned,
  DEFAULT_BASE_URL
} = require('./helpers/test-client');

// Import all 4 tiers
const tier1 = require('./tier1-feature-coverage.test');
const tier2 = require('./tier2-boundary-corner.test');
const tier3 = require('./tier3-cross-feature.test');
const tier4 = require('./tier4-application-scenarios.test');

const allSuites = [
  { tierNumber: 1, suite: tier1 },
  { tierNumber: 2, suite: tier2 },
  { tierNumber: 3, suite: tier3 },
  { tierNumber: 4, suite: tier4 }
];

// Parse CLI arguments
const args = process.argv.slice(2);
let selectedTier = null;
let bailOnError = false;
let customBaseUrl = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--tier' && args[i + 1]) {
    selectedTier = parseInt(args[++i], 10);
  } else if (arg.startsWith('--tier=')) {
    selectedTier = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--bail') {
    bailOnError = true;
  } else if (arg === '--base-url' && args[i + 1]) {
    customBaseUrl = args[++i];
  } else if (arg.startsWith('--base-url=')) {
    customBaseUrl = arg.split('=')[1];
  }
}

const targetBaseUrl = customBaseUrl || process.env.TEST_BASE_URL || DEFAULT_BASE_URL;

async function main() {
  console.log(`\n======================================================================`);
  console.log(`    BookMeter 4-Tier E2E Test Suite (Opaque-Box Requirement Driven)`);
  console.log(`======================================================================`);
  console.log(`  Target Server: ${targetBaseUrl}`);
  console.log(`  Selected Tier: ${selectedTier ? `Tier ${selectedTier}` : 'All Tiers (1 - 4)'}`);
  console.log(`  Bail on Error: ${bailOnError}`);
  console.log(`  Start Time:    ${new Date().toISOString()}`);
  console.log(`======================================================================\n`);

  // Auto-start server if not already active
  let spawnedInfo = null;
  try {
    spawnedInfo = await startServerIfNotRunning(targetBaseUrl);
  } catch (err) {
    console.error(`[FATAL] Server startup failed: ${err.message}`);
    process.exit(1);
  }

  const client = new TestClient(targetBaseUrl);

  const suitesToRun = selectedTier
    ? allSuites.filter(s => s.tierNumber === selectedTier)
    : allSuites;

  if (suitesToRun.length === 0) {
    console.error(`[ERROR] Invalid tier specified: ${selectedTier}. Valid options are 1, 2, 3, 4.`);
    stopServerIfSpawned();
    process.exit(1);
  }

  const suiteResults = [];
  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;
  const overallStart = Date.now();

  for (const { tierNumber, suite } of suitesToRun) {
    console.log(`\n>>> RUNNING TIER ${tierNumber}: ${suite.name} (${suite.tests.length} tests) <<<`);
    console.log(`----------------------------------------------------------------------`);

    let tierPassed = 0;
    let tierFailed = 0;
    const failures = [];
    const tierStart = Date.now();

    for (const test of suite.tests) {
      grandTotal++;
      const testStart = Date.now();
      try {
        await test.fn({
          client,
          assert,
          assertEqual,
          assertStatus,
          assertMagicBytes,
          assertContentDisposition
        });
        const duration = Date.now() - testStart;
        tierPassed++;
        grandPassed++;
        console.log(`  [PASS] [${test.id.padEnd(5)}] ${test.name} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - testStart;
        tierFailed++;
        grandFailed++;
        console.log(`  [FAIL] [${test.id.padEnd(5)}] ${test.name} (${duration}ms)`);
        console.log(`         Error: ${err.message}`);
        failures.push({
          id: test.id,
          name: test.name,
          error: err.message
        });

        if (bailOnError) {
          console.log(`\n[BAIL] Terminating early due to --bail flag.`);
          break;
        }
      }
    }

    const tierDuration = Date.now() - tierStart;
    suiteResults.push({
      tier: `Tier ${tierNumber}`,
      name: suite.name,
      total: suite.tests.length,
      passed: tierPassed,
      failed: tierFailed,
      duration: tierDuration,
      failures
    });

    if (bailOnError && tierFailed > 0) {
      break;
    }
  }

  const overallDuration = Date.now() - overallStart;

  // Print Executive Summary Table
  console.log(`\n======================================================================`);
  console.log(`                     TEST EXECUTION SUMMARY REPORT                   `);
  console.log(`======================================================================`);
  console.log(`  Tier              Total    Passed    Failed    Duration`);
  console.log(`  ---------------  -------  --------  --------  ----------`);

  for (const r of suiteResults) {
    const tierCol = r.tier.padEnd(15);
    const totalCol = String(r.total).padStart(7);
    const passedCol = String(r.passed).padStart(8);
    const failedCol = String(r.failed).padStart(8);
    const durCol = `${r.duration}ms`.padStart(10);
    console.log(`  ${tierCol}  ${totalCol}  ${passedCol}  ${failedCol}  ${durCol}`);
  }

  console.log(`  ---------------  -------  --------  --------  ----------`);
  const totalLine = `TOTAL`.padEnd(15);
  const totalCount = String(grandTotal).padStart(7);
  const passedCount = String(grandPassed).padStart(8);
  const failedCount = String(grandFailed).padStart(8);
  const durCount = `${overallDuration}ms`.padStart(10);
  console.log(`  ${totalLine}  ${totalCount}  ${passedCount}  ${failedCount}  ${durCount}`);
  console.log(`======================================================================\n`);

  if (grandFailed > 0) {
    console.log(`Detailed Failures (${grandFailed} total):`);
    for (const r of suiteResults) {
      for (const f of r.failures) {
        console.log(`  - [${f.id}] ${f.name}`);
        console.log(`    Reason: ${f.error}\n`);
      }
    }
  }

  // Cleanup spawned process if any
  stopServerIfSpawned();

  if (grandFailed > 0) {
    console.log(`[RESULT] FAILED (${grandFailed} tests failed out of ${grandTotal})\n`);
    process.exit(1);
  } else {
    console.log(`[RESULT] ALL TESTS PASSED! (${grandPassed} tests passed)\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('[UNHANDLED RUNNER ERROR]', err);
  stopServerIfSpawned();
  process.exit(1);
});
