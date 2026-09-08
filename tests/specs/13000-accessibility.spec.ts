import { test, expect, type Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { QaStandardsPage } from '../pages/QaStandardsPage';
import { TauPage } from '../pages/TauPage';

// What It Tests: Cross-page accessibility invariants that don't belong to
// any one page's module — heading hierarchy, the skip link, non-decorative
// image alt text, and prefers-reduced-motion actually stopping the hero
// rain animation.
// Why It Matters: These are exactly the kind of regressions a visual review
// misses (a heading level skipped by a future edit, an image added without
// alt text, reduced-motion silently stopping being honored) since nothing
// *looks* wrong — they only show up to assistive tech or motion-sensitive
// visitors.
async function headingLevels(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      // aria-hidden headings (e.g. the intro-splash overlay's own <h2>, a
      // decorative echo of the real hero <h1>) are invisible to assistive
      // tech, so they don't count toward the exposed heading hierarchy.
      .filter((el) => !el.closest('[aria-hidden="true"]'))
      .map((el) => Number(el.tagName[1])),
  );
}

async function nonDecorativeImagesMissingAlt(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('img'))
      .filter((img) => {
        if (img.closest('[aria-hidden="true"]')) return false;
        if (img.getAttribute('aria-hidden') === 'true') return false;
        return !img.hasAttribute('alt');
      })
      .map((img) => img.getAttribute('src') ?? '(no src)'),
  );
}

test.describe('Accessibility', () => {
  const PAGES = [
    { name: 'Home', goto: (page: Page) => new HomePage(page).goto() },
    { name: 'QaStandards', goto: (page: Page) => new QaStandardsPage(page).goto() },
    { name: 'Tau', goto: (page: Page) => new TauPage(page).goto() },
  ];

  test(
    'Test_Case_13000_Global_SkipLink_IsPresentAndTargetsMainContent',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the skip link targets #main-content and focusing it reveals it', async () => {
        await expect.soft(home.skipLink).toHaveAttribute('href', '#main-content');
        await home.skipLink.focus();
        await expect.soft(home.skipLink).toBeVisible();
      });

      await test.step('Then activating it moves focus to the main landmark', async () => {
        await home.skipLink.click();
        await expect.soft(home.mainContent).toBeFocused();
      });
    },
  );

  test(
    'Test_Case_13001_Global_HeadingHierarchy_NeverSkipsALevel',
    { tag: '@regression' },
    async ({ page }) => {
      for (const { name, goto } of PAGES) {
        await goto(page);

        await test.step(`Then ${name}'s heading levels never jump by more than one`, async () => {
          const levels = await headingLevels(page);
          expect.soft(levels[0], `${name}: first heading should be an h1`).toBe(1);

          let maxSeen = 1;
          for (const level of levels) {
            expect
              .soft(level, `${name}: heading level ${level} appears before any h${level - 1}`)
              .toBeLessThanOrEqual(maxSeen + 1);
            maxSeen = Math.max(maxSeen, level);
          }
        });
      }
    },
  );

  test(
    'Test_Case_13002_Global_NonDecorativeImages_AllHaveAltText',
    { tag: '@regression' },
    async ({ page }) => {
      for (const { name, goto } of PAGES) {
        await goto(page);

        await test.step(`Then ${name} has no non-decorative <img> missing alt text`, async () => {
          const missing = await nonDecorativeImagesMissingAlt(page);
          expect.soft(missing, `${name}: images missing alt: ${missing.join(', ')}`).toEqual([]);
        });
      }
    },
  );

  test(
    'Test_Case_13003_Home_ReducedMotion_NeverSchedulesTheHeroRainAnimationLoop',
    { tag: '@regression' },
    async ({ page }) => {
      // No page.waitForTimeout: rather than sleeping and diffing two canvas
      // snapshots, hook requestAnimationFrame before cover-scene.js's module
      // script runs and assert it's never called. cover-scene.js draws one
      // static frame directly (not via rAF) when prefers-reduced-motion is
      // set, and only its own start() would ever schedule a frame — so a
      // zero count here is a direct, race-free proof the loop never started.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => {
        (window as unknown as { __rafCalls: number }).__rafCalls = 0;
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (cb) => {
          (window as unknown as { __rafCalls: number }).__rafCalls++;
          return raf(cb);
        };
      });
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the hero canvas renders once directly, with no animation frame ever scheduled', async () => {
        const canvas = page.locator('canvas').first();
        await expect.soft(canvas).toBeVisible();
        const rafCalls = await page.evaluate(
          () => (window as unknown as { __rafCalls: number }).__rafCalls,
        );
        expect.soft(rafCalls).toBe(0);
      });
    },
  );
});
