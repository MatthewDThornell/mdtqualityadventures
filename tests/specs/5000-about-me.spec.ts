import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The About Me chapter's core identity statement and its
// "7 Habits" list render with the right content and in the right order.
// Why It Matters: This is the one chapter that's pure narrative (no cards,
// no links) — the quote and habit list are the only structured content in
// it worth pinning down against silent copy edits.
test.describe('About Me', () => {
  test(
    'Test_Case_5000_AboutMe_Section_LoadsWithHeadingAndQuote',
    { tag: '@smoke' },
    async ({ page }) => {
      // content, not motion: the quote rotates every 7s (src/quote-rotator.js),
      // and on a loaded runner the page can take longer than that to be asserted
      // against — under reduced motion it holds the first quote
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the About Me heading and core quote are visible', async () => {
        await expect.soft(page.getByRole('heading', { name: 'About Me', level: 2 })).toBeVisible();
        await expect
          .soft(home.aboutQuote)
          .toHaveText('Quality isn’t something we test in. It’s something we build in.');
      });
    },
  );

  test(
    'Test_Case_5001_AboutMe_HabitsList_HasAllSevenHabitsInOrder',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the 7 Habits list is present, in order, unabridged', async () => {
        const expectedHabits = [
          'Be Proactive',
          'Begin with the End in Mind',
          'Put First Things First',
          'Think Win-Win',
          'Seek First to Understand, Then to Be Understood',
          'Synergize',
          'Sharpen the Saw',
        ];
        await expect.soft(home.habitsList).toHaveCount(expectedHabits.length);
        await expect.soft(home.habitsList).toHaveText(expectedHabits);
      });
    },
  );

  // What It Tests: The kit shows every tool as its logo, with the tool's name
  // kept as the image's alt text, and every logo file actually decodes.
  // Why It Matters: A logo grid with no names fails silently in two ways — a
  // missing or mis-cased SVG renders as an empty tile, and a screen reader
  // hears nothing at all. Both looked fine in a text list.
  test(
    'Test_Case_5002_AboutMe_Kit_ShowsEveryToolAsALogoThatDecodes',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await home.kitLogos.first().scrollIntoViewIfNeeded();

      await test.step('Then the four groups hold their twenty tools, each named by its alt', async () => {
        await expect.soft(home.kitLogos).toHaveCount(20);
        const names = await home.kitLogos.evaluateAll((imgs) =>
          imgs.map((i) => (i as HTMLImageElement).alt),
        );
        expect
          .soft(names)
          .toEqual([
            'Playwright',
            'Cypress',
            'Selenium',
            'Appium',
            'Robot Framework',
            'TypeScript',
            'JavaScript',
            'Python',
            'C#',
            'SQL',
            'GitHub Actions',
            'Azure Pipelines',
            'Jenkins',
            'Postman',
            'K6',
            'Jira',
            'Azure DevOps',
            'Power BI',
            'Slack',
            'Figma',
          ]);
      });

      await test.step('Then every logo decoded — no empty tiles', async () => {
        await expect
          .poll(async () =>
            home.kitLogos.evaluateAll((imgs) =>
              imgs
                .filter(
                  (i) =>
                    !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0,
                )
                .map((i) => (i as HTMLImageElement).alt),
            ),
          )
          .toEqual([]);
      });
    },
  );

  test(
    'Test_Case_5003_AboutMe_Quote_WritesItselfOutThenRotates',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const FIRST = 'Quality isn’t something we test in. It’s something we build in.';

      await test.step('Given the quote waits to be written, holding its words', async () => {
        await expect.soft(home.aboutQuote).toHaveClass(/tw-waiting/);
        await expect.soft(home.aboutQuote).toHaveText(FIRST);
      });

      await test.step('When About Me scrolls into view, the quote types itself out', async () => {
        await home.aboutQuote.evaluate((el) =>
          el.scrollIntoView({ block: 'center', behavior: 'instant' }),
        );
        await expect(home.aboutQuote).not.toHaveClass(/tw-waiting/, { timeout: 15_000 });
        await expect.soft(home.aboutQuote).toHaveText(FIRST);
      });

      await test.step('Then it settles, unmarked, and the rotation carries on to the next one', async () => {
        await expect(home.aboutQuote).not.toHaveClass(/is-typing/, { timeout: 30_000 });
        await expect.soft(home.aboutQuote.locator('.tw-typed, .tw-pending')).toHaveCount(0);
        await expect.soft(home.aboutQuote).toBeVisible();
        // the rotator holds each quote ~7s, then fades and writes the next
        await expect(home.aboutQuote).not.toHaveText(FIRST, { timeout: 30_000 });
        await expect.soft(home.aboutQuote).not.toBeEmpty();
      });
    },
  );
});
