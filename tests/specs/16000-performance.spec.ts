import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: That the animations which run while someone is reading stay
// cheap — the typewriter rewrites only the word it is writing, and the hero's
// own typewriter stops once the cover is off screen.
// Why It Matters: Both of these were measured, not guessed. The typewriter
// used to rewrite every word span of a paragraph on every frame, finished or
// not: about 57 DOM mutations a frame, 1,100 a second, to reveal 33
// characters, each one invalidating the paragraph's layout. The hero's quill
// restarted its tap animation by reading offsetWidth, forcing a synchronous
// layout of the whole document ~18 times a second — for as long as the page
// was open, however far away the cover was. Together they cost enough main
// thread that a right-click took ~165ms to show the pen. Counting work rather
// than timing it keeps this honest on a loaded CI box.
test.describe('Performance', () => {
  test(
    'Test_Case_16000_Typewriter_RewritesOnlyTheWordItIsWriting',
    { tag: '@regression' },
    async ({ page }) => {
      test.slow();
      const home = new HomePage(page);
      await home.goto();
      const body = home.spotlightCard('tyler-high').locator('.adventure-body');
      const line = body.locator('> p:not(.card-meta):not(.card-follow)').first();

      await test.step('When the testimony is typing, Then it touches a couple of nodes a frame, not the whole paragraph', async () => {
        await line.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expect(line).toHaveClass(/is-typing/, { timeout: 20_000 });

        const measured = await line.evaluate(
          (el) =>
            new Promise<{ mutationsPerFrame: number; frames: number }>((resolve) => {
              let mutations = 0;
              let frames = 0;
              const observer = new MutationObserver((records) => {
                mutations += records.length;
              });
              observer.observe(el, {
                childList: true,
                characterData: true,
                subtree: true,
                attributes: true,
              });
              const started = performance.now();
              const tick = () => {
                frames += 1;
                if (performance.now() - started < 2000) requestAnimationFrame(tick);
                else {
                  observer.disconnect();
                  resolve({ mutationsPerFrame: mutations / Math.max(1, frames), frames });
                }
              };
              requestAnimationFrame(tick);
            }),
        );

        expect.soft(measured.frames, 'frames were actually counted').toBeGreaterThan(5);
        // ~2-3 in practice: the word being written, and a committed one now and
        // then. The version this replaced measured 57.
        expect
          .soft(
            measured.mutationsPerFrame,
            `typewriter made ${measured.mutationsPerFrame.toFixed(1)} DOM mutations per frame`,
          )
          .toBeLessThan(10);
      });
    },
  );

  test(
    'Test_Case_16001_Hero_Typewriter_StopsWhenTheCoverIsOffScreen',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const tagline = page.getByTestId('hero-tagline');

      await test.step('Given the cover is on screen, the tagline is being written', async () => {
        await expect
          .poll(() => tagline.evaluate((el) => el.textContent?.length ?? 0), { timeout: 15_000 })
          .toBeGreaterThan(0);
      });

      await test.step('When the reader scrolls away, Then it stops rewriting itself', async () => {
        await page
          .locator('#mentors')
          .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        // let any in-flight character land, then watch for a while
        await page.waitForTimeout(600);
        const before = await tagline.textContent();
        await page.waitForTimeout(2500);
        expect
          .soft(await tagline.textContent(), 'the hero kept typing with nobody on the cover')
          .toBe(before);
      });

      await test.step('When they come back, Then it picks up where it left off', async () => {
        const stoppedAt = await tagline.textContent();
        await page
          .locator('#top')
          .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expect.poll(() => tagline.textContent(), { timeout: 20_000 }).not.toBe(stoppedAt);
      });
    },
  );
});
