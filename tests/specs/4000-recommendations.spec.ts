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
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then every card has a non-empty title and quote', async () => {
        for (const slug of SLUGS) {
          const card = home.recCard(slug);
          await expect.soft(card.locator('.rec-title')).not.toBeEmpty();
          await expect.soft(card.locator('blockquote')).not.toBeEmpty();
        }
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
      await test.step('Given the quote starts hidden behind its binary overlay', async () => {
        await expect.soft(card.locator('.quote-decrypt')).toHaveCount(1);
        await expect.soft(quote).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
      });

      await test.step('When the card scrolls into view, the overlay resolves and is removed', async () => {
        await card.scrollIntoViewIfNeeded();
        await expect(card.locator('.quote-decrypt')).toHaveCount(0, { timeout: 8_000 });
      });

      await test.step('Then the real quote is readable in the page colour', async () => {
        await expect.soft(quote).toHaveCSS('color', 'rgb(243, 234, 217)');
        await expect.soft(quote).toContainText('greatest strength');
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
    },
  );
});
