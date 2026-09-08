import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: All six adventure cards (volunteering, side projects, team
// building) are visible, with each card's outbound link — where it has one
// — pointing at a real destination.
// Why It Matters: This is the "life outside work" chapter that makes the
// site read as a person rather than a resume; a broken outbound link here
// is the kind of thing a visitor notices but rarely reports.
test.describe('Adventures', () => {
  const SLUGS = [
    'gentlemans-game',
    'patricks-test-pilot',
    'game-tester',
    'legrand-skydiving',
    'conexed-summit',
    'seekwell-provo-river',
  ];

  test('Test_Case_8000_Adventures_Cards_AreVisible', { tag: '@smoke' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await test.step('Then all six adventure cards are visible', async () => {
      for (const slug of SLUGS) {
        await expect.soft(home.adventureCard(slug)).toBeVisible();
      }
    });
  });

  test(
    'Test_Case_8001_Adventures_Cards_OutboundLinksPointToRealDestinations',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step("Then each card's named link points at the real organization/site", async () => {
        const linkChecks: Array<{ slug: string; name: RegExp | string; href: string }> = [
          { slug: 'patricks-test-pilot', name: 'Patrick’s', href: 'https://patricks.co/' },
          { slug: 'legrand-skydiving', name: 'Legrand', href: 'https://www.legrand.us/' },
          { slug: 'conexed-summit', name: 'ConexED', href: 'https://www.conexed.com/' },
          { slug: 'conexed-summit', name: 'Grand America', href: 'https://www.grandamerica.com/' },
          { slug: 'seekwell-provo-river', name: 'Seekwell', href: 'https://www.seekwell.com/' },
        ];
        for (const { slug, name, href } of linkChecks) {
          await expect
            .soft(home.adventureCard(slug).getByRole('link', { name }))
            .toHaveAttribute('href', href);
        }
      });
    },
  );
});
