import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The Recommendations section's 10 cards each link a real
// name to a real LinkedIn profile and carry an actual quote.
// Why It Matters: Third-party endorsements only carry weight if a hiring
// manager can click through and verify the person is real — a dead or
// missing LinkedIn link quietly kills that trust.
test.describe('Recommendations', () => {
  const SLUGS = [
    'nathan-gearke',
    'samantha-reynolds',
    'ronald-white',
    'tod-mcconahay',
    'andrew-sylvester',
    'stephanie-brunsvik',
    'blake-johnson',
    'rafael-juarez',
    'michael-gorham',
    'jeordin-callister',
  ];

  test(
    'Test_Case_4000_Recommendations_Cards_LinkNameToRealLinkedInProfile',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then every recommendation card is visible with a linked-in name', async () => {
        for (const slug of SLUGS) {
          const card = home.recCard(slug);
          await expect.soft(card).toBeVisible();
          await expect
            .soft(card.locator('h3 a'))
            .toHaveAttribute('href', /^https:\/\/www\.linkedin\.com\/in\//);
        }
      });
    },
  );

  test(
    'Test_Case_4001_Recommendations_Cards_HaveRealQuoteAndTitle',
    { tag: '@regression' },
    async ({ page }) => {
      // walks all ten cards through the viewport, each decrypting as it arrives
      test.slow();
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then every card has a non-empty title and quote', async () => {
        for (const slug of SLUGS) {
          const card = home.recCard(slug);
          await expect.soft(card.locator('.rec-title')).not.toBeEmpty();
          await expect.soft(card.locator('blockquote')).not.toBeEmpty();
        }
      });

      await test.step('Then every card names the company we worked at together, as a chip that decoded', async () => {
        const together: Record<string, string> = {
          'nathan-gearke': 'Veterans United Home Loans',
          'samantha-reynolds': 'Werner Enterprises',
          'ronald-white': 'Werner Enterprises',
          'tod-mcconahay': 'Werner Enterprises',
          'andrew-sylvester': 'ConexED',
          'stephanie-brunsvik': 'ConexED',
          'blake-johnson': 'ConexED',
          'rafael-juarez': 'ConexED',
          'michael-gorham': 'ConexED',
          'jeordin-callister': 'ConexED',
        };
        for (const [slug, company] of Object.entries(together)) {
          const chip = home.recCompany(slug);
          await expect.soft(chip).toHaveAttribute('title', `Worked together at ${company}`);
          // the chips lazy-load, so bring each into view before asking whether it decoded
          await chip.scrollIntoViewIfNeeded();
          await expect
            .poll(() => chip.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth))
            .toBeGreaterThan(0);
        }
      });

      await test.step("Then the LinkedIn marks carry the person's name for assistive tech, not a label", async () => {
        await expect
          .soft(home.recLinkedIn('nathan-gearke'))
          .toHaveAttribute('aria-label', 'Nathan Gearke on LinkedIn');
        await expect.soft(home.recLinkedIn('nathan-gearke')).toHaveText('');
      });

      await test.step("Then Nathan's card offers his letter of recommendation as a download", async () => {
        const letter = page.getByTestId('rec-letter-nathan-gearke');
        await expect.soft(letter).toHaveAttribute('href', '/letter-of-recommendation.pdf');
        await expect.soft(letter).toHaveAttribute('download', '');
        const res = await page.request.get('/letter-of-recommendation.pdf');
        expect.soft(res.ok()).toBeTruthy();
      });
    },
  );

  test(
    'Test_Case_4002_Recommendations_Quote_DecryptsIntoReadableText',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const card = home.recCard('nathan-gearke');
      const quote = card.locator('blockquote p');

      // src/quote-decrypt.js hides the real paragraph behind a binary overlay
      // until the card scrolls into view, then resolves it. The real text is
      // untouched throughout (4001 covers that); what this pins is that the
      // overlay actually goes away and the quote comes back readable — a
      // stuck overlay would leave every recommendation as a block of noise
      // while every text assertion still passed.
      await test.step('Given a card far below the fold: verdict pending, nothing built yet', async () => {
        await expect.soft(card).toHaveAttribute('data-status', 'pending');
        await expect.soft(card.locator('.quote-decrypt')).toHaveCount(0);
      });

      await test.step('When the card comes within a screen of the viewport, its binary overlay is built', async () => {
        // parked just below the viewport: inside the build margin, short of the
        // 25%-visible threshold that starts the decrypt
        await card.evaluate((el) => {
          window.scrollTo(
            0,
            el.getBoundingClientRect().top + window.scrollY - window.innerHeight - 300,
          );
        });
        await expect(card.locator('.quote-decrypt')).toHaveCount(1);
        await expect.soft(quote).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
        await expect.soft(card).toHaveAttribute('data-status', 'pending');
      });

      await test.step('When the card scrolls into view, the overlay resolves and is removed', async () => {
        await card.scrollIntoViewIfNeeded();
        await expect(card.locator('.quote-decrypt')).toHaveCount(0, { timeout: 8_000 });
      });

      await test.step('Then the real quote is readable in the page colour, and the verdict is PASS', async () => {
        await expect.soft(quote).toHaveCSS('color', 'rgb(243, 234, 217)');
        await expect.soft(quote).toContainText('greatest strength');
        await expect.soft(card).toHaveAttribute('data-status', 'pass');
      });
    },
  );

  test(
    'Test_Case_4003_Recommendations_Quote_ReducedMotion_SkipsTheDecrypt',
    { tag: '@regression' },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then no overlay is built and every quote is readable from the start', async () => {
        await expect.soft(page.locator('.quote-decrypt')).toHaveCount(0);
        await expect
          .soft(home.recCard('nathan-gearke').locator('blockquote p'))
          .toHaveCSS('color', 'rgb(243, 234, 217)');
      });

      await test.step("Then Quaid's card reads as failed from the start, its report already written", async () => {
        await expect.soft(home.recCard('quaid')).not.toHaveAttribute('data-status', /./);
        await expect.soft(home.quaidReport).not.toHaveClass(/is-typing/);
        await expect.soft(home.quaidGeneratedTest).toContainText('Test_Case_4004');
      });
    },
  );

  // What It Tests: A recommendation card only ever belongs to a real person.
  // Why It Matters: Quaid is a mannequin with 99+ years of experience — if he
  // can get a card, so can any bug that dresses the part. This is the test his
  // card types out on the page, word for word; it has to exist for that to be
  // honest.
  test(
    'Test_Case_4004_Recommendations_Quaid_IsNotAHuman',
    { tag: '@smoke' },
    async ({ page, request }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Ensure that Quaid, who is not a human, does not show up in recommendations', async () => {
        await expect(home.recCard('quaid')).toHaveClass(/rec-card-failed/);
        await expect(home.recommendationLetters).toHaveCount(10);
      });

      await test.step('And the API has no record of him', async () => {
        const res = await request.get('/api/humans/quaid');
        expect(res.status()).toBe(404);
      });
    },
  );

  test(
    'Test_Case_4005_Recommendations_Quaid_FailsAndWritesItsOwnTestCase',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const card = home.recCard('quaid');

      await test.step("Given his verdict is pending like everyone else's", async () => {
        await expect.soft(card).toHaveAttribute('data-status', 'pending');
        await expect.soft(home.quaidReport).toBeHidden();
      });

      await test.step('When the card scrolls into view, the decrypt fails him', async () => {
        await card.scrollIntoViewIfNeeded();
        await expect(card).toHaveAttribute('data-status', 'fail', { timeout: 10_000 });
        await expect.soft(card.locator('blockquote p')).toContainText('Received: undefined');
      });

      await test.step('Then the investigation types out, root cause first', async () => {
        await expect(page.getByTestId('quaid-log-fail')).toBeVisible();
        await expect(
          home.quaidReport.locator('.qa-line', { hasText: 'Root cause found' }),
        ).toBeVisible({
          timeout: 10_000,
        });
      });

      await test.step('Then it writes the test case above, and links the spec it lives in', async () => {
        await expect(home.quaidReport).toHaveClass(/is-complete/, { timeout: 30_000 });
        await expect
          .soft(home.quaidGeneratedTest)
          .toContainText(
            'Ensure that Quaid, who is not a human, does not show up in recommendations',
          );
        await expect
          .soft(home.quaidGeneratedTest)
          .toContainText("request.get('/api/humans/quaid')");
        await expect
          .soft(page.getByTestId('quaid-log-done').getByRole('link'))
          .toHaveAttribute('href', /tests\/specs\/4000-recommendations\.spec\.ts$/);
      });
    },
  );
});
