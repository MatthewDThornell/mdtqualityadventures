import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: Every mentor card is visible and named; the three mentors
// with a LinkedIn profile link to it, while Alex Zhukovsky's card correctly
// has none.
// Why It Matters: Alex Zhukovsky's card reads as a missing-link bug on
// casual inspection (every other card links out) — it's intentional, per
// his own request — so this test locks that decision in rather than letting
// someone "fix" it later. See the HTML comment directly above his card.
test.describe('Mentors', () => {
  const LINKED_MENTORS: Record<string, string> = {
    'carlos-kidman': 'https://www.linkedin.com/in/carlos-kidman/',
    'aj-larson': 'https://www.linkedin.com/in/qajlarson/',
    'tim-velasquez': 'https://www.linkedin.com/in/tim-velasquez-80880223/',
  };

  test('Test_Case_6000_Mentors_Cards_AreVisibleWithNames', { tag: '@smoke' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await test.step('Then all four mentor cards are visible', async () => {
      await expect.soft(home.mentorCard('alex-zhukovsky')).toBeVisible();
      for (const slug of Object.keys(LINKED_MENTORS)) {
        await expect.soft(home.mentorCard(slug)).toBeVisible();
      }
    });

    await test.step('Then Alex Zhukovsky is named as text, not a link', async () => {
      const alexCard = home.mentorCard('alex-zhukovsky');
      await expect.soft(alexCard.locator('h3')).toHaveText('Alex Zhukovsky');
      await expect.soft(alexCard.locator('h3 a')).toHaveCount(0);
    });
  });

  test(
    'Test_Case_6001_Mentors_LinkedCards_PointToRealLinkedInProfiles',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then every other mentor card links its name to LinkedIn', async () => {
        for (const [slug, href] of Object.entries(LINKED_MENTORS)) {
          await expect.soft(home.mentorCard(slug).locator('h3 a')).toHaveAttribute('href', href);
        }
      });
    },
  );
});
