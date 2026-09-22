import { test, expect, type Locator } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: Every accomplishment card is visible and, where it names a
// real employer/organization, links to that organization's actual site; and
// each card carries its own test case — written in the tool the work was done
// in — that runs and passes before the entry decrypts.
// Why It Matters: These cards are the proof behind the resume's claims — a
// broken or missing company link undercuts the credibility they're meant to
// build. The tests on them are the site's claim to versatility: five
// frameworks, one voice, and every one of them has to read as real code.
test.describe('Accomplishments', () => {
  const CARD_LINKS: Record<string, { name: RegExp | string; href: string }> = {
    'veterans-united-coverage': {
      name: /veterans united/i,
      href: 'https://www.veteransunited.com/',
    },
    'werner-reporting': { name: /werner enterprises/i, href: 'https://www.werner.com/' },
    'conexed-migration': { name: 'ConexED', href: 'https://www.conexed.com/' },
    'seekwell-stabilizing': { name: 'Seekwell', href: 'https://www.seekwell.com/' },
    'cast-speaking': {
      name: /association for software testing/i,
      href: 'https://www.associationforsoftwaretesting.org/',
    },
  };

  test(
    'Test_Case_3000_Accomplishments_Cards_AreVisibleWithRealCompanyLinks',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then every accomplishment card is visible', async () => {
        for (const slug of Object.keys(CARD_LINKS)) {
          await expect.soft(home.accomplishmentCard(slug)).toBeVisible();
        }
      });

      await test.step('Then each card names the real company/organization it happened at', async () => {
        for (const [slug, { name, href }] of Object.entries(CARD_LINKS)) {
          await expect
            .soft(home.accomplishmentCard(slug).getByRole('link', { name }))
            .toHaveAttribute('href', href);
        }
      });
    },
  );

  test(
    'Test_Case_3001_Accomplishments_Cards_HaveHeadlineText',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then each card has its own non-empty h3 headline', async () => {
        const headlines: Record<string, string> = {
          'veterans-united-coverage': 'Zero to 80% coverage',
          'werner-reporting': 'Quality by the numbers',
          'conexed-migration': '400+ tests, 60% faster',
          'seekwell-stabilizing': 'Stabilizing under pressure',
          'cast-speaking': 'Asking the Right Questions',
        };
        for (const [slug, title] of Object.entries(headlines)) {
          await expect.soft(home.accomplishmentCard(slug).locator('h3')).toHaveText(title);
        }
      });
    },
  );

  // the accomplishment cards type and grow as their own tests run; see the
  // note on bringIntoView in 4000-recommendations.spec.ts
  const bringIntoView = (locator: Locator) =>
    locator.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));

  // each entry's test is written in the tool the work itself was done in
  const CARD_TESTS: Record<string, { lang: string; label: string; name: string; steps: number }> = {
    'veterans-united-coverage': {
      lang: 'ts',
      label: 'Playwright · TypeScript',
      name: 'Test Case 3101 - VU - Accomplishment Entry Renders',
      steps: 3,
    },
    'werner-reporting': {
      lang: 'cs',
      label: 'Playwright · C#',
      name: 'Test Case 3102 - WE - Accomplishment Entry Renders',
      steps: 4,
    },
    'conexed-migration': {
      lang: 'cy',
      label: 'Cypress · JavaScript',
      name: 'Test Case 3103 - CX - Accomplishment Entry Renders',
      steps: 4,
    },
    'seekwell-stabilizing': {
      lang: 'py',
      label: 'Playwright · Python',
      name: 'Test Case 3104 - SW - Accomplishment Entry Renders',
      steps: 4,
    },
    'cast-speaking': {
      lang: 'rf',
      label: 'Robot Framework',
      name: 'Test Case 3105 - AST - Accomplishment Entry Renders',
      steps: 4,
    },
  };

  test(
    'Test_Case_3002_Accomplishments_Cards_CarryTheirOwnTests_InFiveFrameworks',
    { tag: '@regression' },
    async ({ page }) => {
      // content, not motion: nothing runs, nothing decrypts
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const home = new HomePage(page);
      await home.goto();

      for (const [slug, { lang, label, name, steps }] of Object.entries(CARD_TESTS)) {
        await test.step(`Then the ${slug} card carries a closed, readable test in ${label}`, async () => {
          const ownTest = home.accomplishmentTest(slug);
          await expect.soft(ownTest).toHaveAttribute('data-lang', lang);
          await expect.soft(ownTest).not.toHaveAttribute('open', /./);
          await expect.soft(ownTest.locator('.rec-test-lang')).toHaveText(label);
          await expect
            .soft(ownTest.locator('.rec-test-lang img'))
            .toHaveJSProperty('complete', true);
          await expect.soft(ownTest.locator('.rec-test-name')).toHaveText(name);
          await expect.soft(ownTest.locator('.rec-test-status')).toHaveText(`${steps} steps`);
          // every framework carries the title verbatim — Python in its docstring,
          // C# in its [Description], Robot as the case name — then the code
          // checks the headline and ends on the verdict
          const code = ownTest.locator('.qa-code');
          await expect.soft(code).toContainText(name);
          await expect.soft(code).toContainText('Then the entry is headed');
          await expect.soft(code).toContainText('data-status');
        });
      }

      await test.step('Then, with motion off, no card carries a verdict and every entry reads plainly', async () => {
        await expect.soft(page.locator('.card-tested[data-status]')).toHaveCount(0);
        await expect.soft(page.locator('.card-tested .quote-decrypt')).toHaveCount(0);
      });

      await test.step('Then the five tests are in five different frameworks', async () => {
        const langs = await page
          .locator('.card-tested .rec-test')
          .evaluateAll((els) => els.map((el) => el.getAttribute('data-lang')));
        expect.soft(new Set(langs).size).toBe(5);
      });
    },
  );

  test(
    'Test_Case_3003_Accomplishments_Card_RunsItsOwnTestThenDecrypts',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const card = home.accomplishmentCard('werner-reporting');
      const ownTest = home.accomplishmentTest('werner-reporting');
      const entry = card.locator('.card-body p');

      await test.step("Given the card's verdict is pending and its test waits closed", async () => {
        await expect.soft(card).toHaveAttribute('data-status', 'pending');
        await expect.soft(ownTest).not.toHaveAttribute('open', /./);
        // the entry's real text is there for a reader the whole time
        await expect
          .soft(entry)
          .toContainText('Designed enterprise-level QA reporting in Power BI');
      });

      await test.step('When the card scrolls into view, its test runs', async () => {
        await bringIntoView(card);
        await expect(ownTest).toHaveClass(/is-running|is-passed/, { timeout: 10_000 });
      });

      await test.step('Then it passes, folds away, and the entry decrypts into a PASS', async () => {
        await expect(ownTest).toHaveClass(/is-passed/, { timeout: 10_000 });
        await expect.soft(ownTest.locator('.rec-test-status')).toHaveText('');
        await expect(card).toHaveAttribute('data-status', 'pass', { timeout: 10_000 });
        await expect.soft(card.locator('.quote-decrypt')).toHaveCount(0);
        await expect.soft(entry).not.toHaveClass(/quote-decrypt-hidden/);
        await expect
          .soft(entry)
          .toContainText('Designed enterprise-level QA reporting in Power BI');
      });
    },
  );
});
