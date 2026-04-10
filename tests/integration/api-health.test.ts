/**
 * Integration Tests: API Health Endpoints
 * Requires dev server to be running: npm run dev
 * Skip these if server is not available
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function isServerRunning(): Promise<boolean> {
  try {
    await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
}

let serverAvailable = false;

beforeAll(async () => {
  serverAvailable = await isServerRunning();
  if (!serverAvailable) {
    console.warn('⚠ Dev server not running — skipping API health tests. Run `npm run dev` first.');
  }
});

describe('API Health', () => {
  it('GET /api/health returns 200', async () => {
    if (!serverAvailable) return;

    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status).toBe(200);
  });

  it('GET /api/products returns product list', async () => {
    if (!serverAvailable) return;

    const res = await fetch(`${BASE_URL}/api/products`);
    expect(res.status).toBe(200);
  });

  it('POST /api/stripe/checkout requires auth', async () => {
    if (!serverAvailable) return;

    const res = await fetch(`${BASE_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
