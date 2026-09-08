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
});
