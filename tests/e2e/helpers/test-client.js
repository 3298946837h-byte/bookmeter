/**
 * Standalone E2E Test Client & Assertion Utilities for BookMeter
 * Uses native Node.js (v18+) fetch and Buffer APIs. Zero external test framework dependencies.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

const DEFAULT_PORT = process.env.PORT || 5000;
const DEFAULT_BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${DEFAULT_PORT}`;
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

let spawnedServerProcess = null;

class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new AssertionError(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new AssertionError(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      actual,
      expected
    );
  }
}

function assertStatus(res, expectedStatus, message) {
  const actual = res.status;
  if (actual !== expectedStatus) {
    const errorBody = res.data && typeof res.data === 'object' ? JSON.stringify(res.data) : (res.raw || '');
    throw new AssertionError(
      message || `Expected HTTP status ${expectedStatus}, but got ${actual}. Response body: ${errorBody.slice(0, 200)}`,
      actual,
      expectedStatus
    );
  }
}

/**
 * Validates binary stream magic bytes:
 * - EPUB: starts with 0x50 0x4B 0x03 0x04 (PK\x03\x04 zip header)
 * - PDF:  starts with 0x25 0x50 0x44 0x46 (%PDF header)
 * - TXT:  valid UTF-8 string, non-empty, and NOT an HTML error page (<!DOCTYPE html, <html) or JSON error
 */
function assertMagicBytes(buffer, format) {
  assert(Buffer.isBuffer(buffer), 'Provided payload must be a Buffer');
  assert(buffer.length > 0, 'Buffer must not be empty');

  const fmt = (format || '').toLowerCase().trim();

  if (fmt === 'epub') {
    assert(
      buffer.length >= 4,
      `EPUB buffer too short (${buffer.length} bytes), expected >= 4 bytes`
    );
    const magic = buffer.subarray(0, 4);
    const isZip =
      magic[0] === 0x50 &&
      magic[1] === 0x4b &&
      magic[2] === 0x03 &&
      magic[3] === 0x04;
    assert(
      isZip,
      `Invalid EPUB magic bytes. Expected [50 4B 03 04] (PK..), got [${magic.toString('hex').toUpperCase().match(/../g).join(' ')}]`
    );
  } else if (fmt === 'pdf') {
    assert(
      buffer.length >= 4,
      `PDF buffer too short (${buffer.length} bytes), expected >= 4 bytes`
    );
    const magic = buffer.subarray(0, 4);
    const isPdf =
      magic[0] === 0x25 &&
      magic[1] === 0x50 &&
      magic[2] === 0x44 &&
      magic[3] === 0x46;
    assert(
      isPdf,
      `Invalid PDF magic bytes. Expected [25 50 44 46] (%PDF), got [${magic.toString('hex').toUpperCase().match(/../g).join(' ')}]`
    );
  } else if (fmt === 'txt') {
    const textSample = buffer.toString('utf8', 0, Math.min(buffer.length, 500)).trim();
    assert(
      textSample.length > 0,
      'TXT file content decoded as UTF-8 must be non-empty'
    );
    const lower = textSample.toLowerCase();
    assert(
      !lower.startsWith('<!doctype html') &&
      !lower.startsWith('<html') &&
      !lower.startsWith('<?xml'),
      `TXT stream contains HTML/XML markup instead of plain text: "${textSample.slice(0, 100)}..."`
    );
    assert(
      !textSample.startsWith('{"error"') && !textSample.startsWith('{"message"'),
      `TXT stream contains JSON error instead of book text: "${textSample.slice(0, 100)}"`
    );
  } else {
    throw new Error(`Unsupported format for magic byte assertion: ${format}`);
  }
}

/**
 * Validates Content-Disposition header conforming to RFC 6266 / RFC 5987:
 * e.g. attachment; filename="<title>.<ext>"; filename*=UTF-8''<encoded>.<ext>
 */
function assertContentDisposition(headers, expectedFormat) {
  const cd = headers.get ? headers.get('content-disposition') : (headers['content-disposition'] || '');
  assert(
    cd && typeof cd === 'string',
    `Expected Content-Disposition header to exist, but got: "${cd}"`
  );
  assert(
    cd.toLowerCase().includes('attachment'),
    `Expected Content-Disposition to indicate "attachment", got: "${cd}"`
  );

  const ext = `.${expectedFormat.toLowerCase()}`;
  assert(
    cd.toLowerCase().includes(ext),
    `Expected Content-Disposition to include extension "${ext}", got: "${cd}"`
  );
}

/**
 * Checks if target server is responding
 */
async function isServerRunning(baseUrl = DEFAULT_BASE_URL) {
  try {
    const url = new URL('/api/books', baseUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 500;
  } catch (err) {
    return false;
  }
}

/**
 * Starts backend server child process if not already running
 */
async function startServerIfNotRunning(baseUrl = DEFAULT_BASE_URL) {
  const running = await isServerRunning(baseUrl);
  if (running) {
    return { spawned: false, baseUrl };
  }

  console.log(`[Test Infra] Starting server at ${baseUrl} for E2E tests...`);
  const serverPath = path.join(PROJECT_ROOT, 'server', 'index.js');

  spawnedServerProcess = spawn(process.execPath, [serverPath], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PORT: DEFAULT_PORT },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  spawnedServerProcess.stdout.on('data', (data) => {
    // console.log(`[server stdout] ${data}`);
  });
  spawnedServerProcess.stderr.on('data', (data) => {
    // console.error(`[server stderr] ${data}`);
  });

  const startTime = Date.now();
  const maxWaitMs = 15000;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (await isServerRunning(baseUrl)) {
      console.log(`[Test Infra] Server ready at ${baseUrl} (${Date.now() - startTime}ms)`);
      return { spawned: true, baseUrl };
    }
  }

  stopServerIfSpawned();
  throw new Error(`[Test Infra] Failed to start backend server at ${baseUrl} within ${maxWaitMs}ms`);
}

/**
 * Cleanly terminates spawned server child process
 */
function stopServerIfSpawned() {
  if (spawnedServerProcess && spawnedServerProcess.pid) {
    console.log(`[Test Infra] Cleaning up spawned server (PID: ${spawnedServerProcess.pid})...`);
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${spawnedServerProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        spawnedServerProcess.kill('SIGTERM');
      }
    } catch (e) {
      // Process may already be dead
    }
    spawnedServerProcess = null;
  }
}

// Auto cleanup on exit
process.on('exit', () => stopServerIfSpawned());
process.on('SIGINT', () => {
  stopServerIfSpawned();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopServerIfSpawned();
  process.exit(143);
});

class TestClient {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  buildUrl(endpoint, params = {}) {
    let urlStr = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const url = new URL(urlStr);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }
    return url.toString();
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      params = {},
      headers = {},
      body = null,
      timeout = 15000,
      ...fetchOptions
    } = options;

    const fullUrl = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const init = {
      method,
      headers: { ...headers },
      signal: controller.signal,
      ...fetchOptions
    };

    if (body) {
      if (typeof body === 'object' && !(body instanceof Buffer) && !(body instanceof Uint8Array)) {
        init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json';
        init.body = JSON.stringify(body);
      } else {
        init.body = body;
      }
    }

    try {
      const res = await fetch(fullUrl, init);
      clearTimeout(timer);

      const contentType = res.headers.get('content-type') || '';
      let data = null;
      let raw = '';

      if (method === 'HEAD') {
        return {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
          data: null,
          raw: '',
          ok: res.ok,
          url: fullUrl
        };
      }

      if (contentType.includes('application/json')) {
        raw = await res.text();
        try {
          data = JSON.parse(raw);
        } catch (e) {
          data = null;
        }
      } else {
        raw = await res.text();
        data = raw;
      }

      return {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data,
        raw,
        ok: res.ok,
        url: fullUrl
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms: ${fullUrl}`);
      }
      throw err;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async head(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'HEAD' });
  }

  /**
   * Downloads a binary stream and returns Buffer payload
   */
  async download(endpoint, options = {}) {
    const {
      params = {},
      headers = {},
      timeout = 30000,
      ...fetchOptions
    } = options;

    const fullUrl = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
        ...fetchOptions
      });
      clearTimeout(timer);

      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      return {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        buffer,
        byteLength: buffer.length,
        ok: res.ok,
        url: fullUrl
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Download timed out after ${timeout}ms: ${fullUrl}`);
      }
      throw err;
    }
  }
}

/**
 * Standard test runner for a suite of tests
 */
async function runSuite(suiteTitle, tests, options = {}) {
  const client = new TestClient(options.baseUrl || DEFAULT_BASE_URL);
  console.log(`\n======================================================`);
  console.log(`RUNNING SUITE: ${suiteTitle}`);
  console.log(`Total tests: ${tests.length}`);
  console.log(`Target: ${client.baseUrl}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures = [];
  const startTime = Date.now();

  for (const test of tests) {
    const testStart = Date.now();
    try {
      await test.fn({ client, assert, assertEqual, assertStatus, assertMagicBytes, assertContentDisposition });
      const duration = Date.now() - testStart;
      passed++;
      console.log(`  [PASS] [${test.id}] ${test.name} (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - testStart;
      failed++;
      console.log(`  [FAIL] [${test.id}] ${test.name} (${duration}ms)`);
      console.log(`         Error: ${err.message}`);
      failures.push({
        id: test.id,
        name: test.name,
        error: err.message,
        stack: err.stack
      });
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`\n------------------------------------------------------`);
  console.log(`SUITE SUMMARY: ${suiteTitle}`);
  console.log(`Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped} | Time: ${totalDuration}ms`);
  console.log(`------------------------------------------------------\n`);

  return {
    suiteTitle,
    total: tests.length,
    passed,
    failed,
    skipped,
    duration: totalDuration,
    failures
  };
}

module.exports = {
  TestClient,
  AssertionError,
  assert,
  assertEqual,
  assertStatus,
  assertMagicBytes,
  assertContentDisposition,
  isServerRunning,
  startServerIfNotRunning,
  stopServerIfSpawned,
  runSuite,
  DEFAULT_BASE_URL,
  DEFAULT_PORT,
  PROJECT_ROOT
};
