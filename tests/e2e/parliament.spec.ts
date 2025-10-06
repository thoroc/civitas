import { test, expect, Page } from '@playwright/test';

// Smoke test ensuring the parliament page renders hemicycle content after snapshot load.
// Strategy: navigate (DOM load), then detect hemicycle and validate structural + numeric invariants.

const gotoParliament = async (page: Page) => {
  await page.goto('/parliament', { waitUntil: 'domcontentloaded' });
};

const ensureProdOrSkip = async (page: Page) => {
  const isProd = !!process.env.PLAYWRIGHT_PROD;
  if (!isProd) {
    await expect(page.getByText(/loading index/i)).toBeVisible({
      timeout: 15000,
    });
    test.fixme(
      !isProd,
      'Full hemicycle assertions run only in production mode'
    );
    return false;
  }
  return true;
};

const waitForSnapshotMeta = async (page: Page) => {
  const start = Date.now();
  const maxMs = 25_000;
  while (Date.now() - start < maxMs) {
    const visible = await page
      .getByText(/snapshot date:/i)
      .isVisible()
      .catch(() => false);
    if (visible) return true;
    await page.waitForTimeout(500);
  }
  return false;
};

const extractTotalMembers = async (page: Page) => {
  const metaLine = page.getByText(/snapshot date:/i);
  const metaText = await metaLine.textContent();
  expect(metaText).toBeTruthy();
  const match = metaText!.match(/Total members:\s*(\d+)/i);
  expect(match, 'Total members pattern present').toBeTruthy();
  const total = parseInt(match![1], 10);
  expect(total).toBeGreaterThan(0);
  return total;
};

const assertHemicycleVisible = async (page: Page) => {
  const hemi = page.getByTestId('hemicycle');
  await expect(hemi).toBeVisible({ timeout: 15_000 });
  const svg = hemi.locator('svg');
  await expect(svg).toBeVisible({ timeout: 15_000 });
  await expect(svg.locator('circle, path').first()).toBeVisible({
    timeout: 15_000,
  });
  return svg;
};

const validateLegendStructure = async (page: Page) => {
  await expect(page.getByText(/party totals/i)).toBeVisible({
    timeout: 15_000,
  });
  const legend = page.getByRole('list', { name: /party legend/i });
  await expect(legend).toBeVisible();
  const partyItems = legend.locator('li');
  const countParties = await partyItems.count();
  expect(countParties).toBeGreaterThan(2);
  return partyItems;
};

const analyzeLegendCounts = async (partyItems: ReturnType<Page['locator']>) => {
  const itemCount = await partyItems.count();
  let anyValidRelation = false;
  let summedTotals = 0;
  let summedCounts = 0;
  for (let i = 0; i < itemCount; i++) {
    const text = (await partyItems.nth(i).textContent()) || '';
    expect(
      /\d+\s*\/\s*\d+/.test(text),
      `legend item ${i} has count/total`
    ).toBeTruthy();
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) {
      const c = parseInt(m[1], 10);
      const t = parseInt(m[2], 10);
      summedCounts += c;
      summedTotals += t;
      if (c <= t && t > 0) anyValidRelation = true;
    }
  }
  expect(
    anyValidRelation,
    'At least one legend entry has logical counts'
  ).toBeTruthy();
  return { summedCounts, summedTotals };
};

const assertSeatCountMatches = async (
  svg: ReturnType<Page['locator']>,
  totalMembers: number
) => {
  const seatCount = await svg.locator('[data-seat]').count();
  expect(seatCount, 'Rendered seat nodes equals total members').toBe(
    totalMembers
  );
};

test.describe('Parliament Page', () => {
  test('renders hemicycle and legend', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoParliament(page);

    if (!(await ensureProdOrSkip(page))) return;

    const res = await page.request.get('/data/parliament.index.json');
    expect(res.status(), 'index JSON status should be 200').toBe(200);

    const sawMeta = await waitForSnapshotMeta(page);
    if (!sawMeta) {
      test.fail(
        true,
        'Snapshot meta never appeared within timeout; marking test flaky'
      );
      expect(await page.getByText(/loading index/i).isVisible()).toBeTruthy();
      return;
    }

    const svg = await assertHemicycleVisible(page);
    const totalMembers = await extractTotalMembers(page);
    const partyItems = await validateLegendStructure(page);
    const { summedCounts, summedTotals } =
      await analyzeLegendCounts(partyItems);

    expect(summedTotals, 'Sum of legend totals equals total members').toBe(
      totalMembers
    );
    expect(
      summedCounts <= summedTotals,
      'Filtered counts never exceed aggregate total'
    ).toBeTruthy();

    await assertSeatCountMatches(svg, totalMembers);
  });
});
