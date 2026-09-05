/**
 * Lightweight test runner — no external dependencies.
 * Supports: describe, it, beforeEach, afterEach, expect (assertions).
 * Usage: node tests/test_runner.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// ---- Test framework globals ----
const suites = [];
let currentSuite = null;
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function describe(name, fn) {
  const suite = { name, tests: [], beforeEach: null, afterEach: null, suites: [] };
  const prev = currentSuite;
  currentSuite = suite;
  fn();
  currentSuite = prev;
  if (prev) prev.suites.push(suite);
  else suites.push(suite);
}

function it(name, fn) {
  if (currentSuite) currentSuite.tests.push({ name, fn });
}

it.skip = (name) => {
  if (currentSuite) currentSuite.tests.push({ name, fn: null, skip: true });
};

function beforeEach(fn) {
  if (currentSuite) currentSuite.beforeEach = fn;
}

function afterEach(fn) {
  if (currentSuite) currentSuite.afterEach = fn;
}

// ---- Expect (assertion) helpers ----
function expect(actual) {
  return {
    toBe: (expected) => assert.strictEqual(actual, expected, `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`),
    toEqual: (expected) => assert.deepStrictEqual(actual, expected, `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`),
    toBeTruthy: () => assert.ok(actual, `Expected ${JSON.stringify(actual)} to be truthy`),
    toBeFalsy: () => assert.ok(!actual, `Expected ${JSON.stringify(actual)} to be falsy`),
    toBeNull: () => assert.strictEqual(actual, null, `Expected ${JSON.stringify(actual)} to be null`),
    toBeUndefined: () => assert.strictEqual(actual, undefined, `Expected ${JSON.stringify(actual)} to be undefined`),
    toBeDefined: () => assert.notStrictEqual(actual, undefined, `Expected value to be defined`),
    toBeGreaterThan: (n) => assert.ok(actual > n, `Expected ${actual} > ${n}`),
    toBeGreaterThanOrEqual: (n) => assert.ok(actual >= n, `Expected ${actual} >= ${n}`),
    toBeLessThan: (n) => assert.ok(actual < n, `Expected ${actual} < ${n}`),
    toBeLessThanOrEqual: (n) => assert.ok(actual <= n, `Expected ${actual} <= ${n}`),
    toBeInstanceOf: (cls) => assert.ok(actual instanceof cls, `Expected ${actual} to be instance of ${cls.name}`),
    toContain: (item) => assert.ok(
      Array.isArray(actual) ? actual.includes(item) : String(actual).includes(item),
      `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`
    ),
    toMatch: (regex) => assert.ok(regex.test(actual), `Expected ${JSON.stringify(actual)} to match ${regex}`),
    toHaveLength: (n) => assert.strictEqual(actual.length, n, `Expected length ${n}, got ${actual.length}`),
    toHaveProperty: (prop, val) => {
      assert.ok(actual && prop in actual, `Expected ${JSON.stringify(actual)} to have property ${prop}`);
      if (val !== undefined) assert.strictEqual(actual[prop], val, `Expected ${prop}=${val}, got ${actual[prop]}`);
    },
    not: {
      toBe: (expected) => assert.notStrictEqual(actual, expected),
      toEqual: (expected) => assert.notDeepStrictEqual(actual, expected),
      toBeNull: () => assert.notStrictEqual(actual, null),
      toContain: (item) => assert.ok(
        Array.isArray(actual) ? !actual.includes(item) : !String(actual).includes(item),
        `Expected ${JSON.stringify(actual)} NOT to contain ${JSON.stringify(item)}`
      ),
      toHaveLength: (n) => assert.notStrictEqual(actual.length, n),
    },
    resolves: { // placeholder — tests use async/await directly
      toBe: (expected) => assert.strictEqual(actual, expected),
    },
  };
}

// ---- Runner ----
async function runSuite(suite, indent = '') {
  console.log(`${indent}  ${suite.name}`);

  for (const test of suite.tests) {
    if (test.skip) {
      console.log(`${indent}    \u26aa \u2502 ${test.name} (skipped)`);
      skipped++;
      continue;
    }
    try {
      if (suite.beforeEach) await suite.beforeEach();
      await test.fn();
      if (suite.afterEach) await suite.afterEach();
      console.log(`${indent}    \u2713 \u2502 ${test.name}`);
      passed++;
    } catch (err) {
      console.log(`${indent}    \u2717 \u2502 ${test.name}`);
      console.log(`${indent}      \u2192 ${err.message}`);
      failures.push({ suite: suite.name, test: test.name, error: err });
      failed++;
      if (suite.afterEach) {
        try { await suite.afterEach(); } catch {}
      }
    }
  }

  for (const child of suite.suites) {
    await runSuite(child, indent + '  ');
  }
}

async function main() {
  // Load setup
  require('./setup.js');

  // Load all test files
  const testDir = __dirname;
  const testFiles = fs.readdirSync(testDir)
    .filter((f) => f.startsWith('test_') && f.endsWith('.js') && f !== 'test_runner.js')
    .sort();

  console.log('\n\u2550'.repeat(70));
  console.log('  Gebya Net Backend Test Suite');
  console.log('\u2550'.repeat(70));
  console.log(`  Found ${testFiles.length} test file(s)\n`);

  for (const file of testFiles) {
    console.log(`\n  \u2500\u2500 ${file} \u2500\u2500`);
    // Clear module cache so each file re-requires fresh
    const fullPath = path.join(testDir, file);
    delete require.cache[fullPath];
    require(fullPath);
  }

  // Run all collected suites
  for (const suite of suites) {
    await runSuite(suite);
  }

  // Summary
  console.log('\n' + '\u2550'.repeat(70));
  console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('\u2550'.repeat(70));

  if (failures.length > 0) {
    console.log('\n  Failures:\n');
    failures.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.suite} \u203a ${f.test}`);
      console.log(`     ${f.error.message}\n`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Expose globals
global.describe = describe;
global.it = it;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.expect = expect;

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
