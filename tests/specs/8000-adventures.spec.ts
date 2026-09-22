import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: Every adventure card — the businesses and rooms in the
// Quality Adventures chapter, plus the three team-building cards that live in
// the About Me chapter instead — is visible, with each card's outbound link,
// where it has one, pointing at a real destination.
// Why It Matters: This is the "life outside work" content that makes the
// site read as a person rather than a resume; a broken outbound link here
// is the kind of thing a visitor notices but rarely reports.
test.describe('Adventures', () => {
  const SLUGS = [
    'gentlemans-game',
    'patricks-test-pilot',
    'city-barbers',
    'city-barbers-ace',
    'game-tester',
    'legrand-skydiving',
    'conexed-summit',
    'seekwell-provo-river',
  ];

  test('Test_Case_8000_Adventures_Cards_AreVisible', { tag: '@smoke' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await test.step('Then every adventure card is visible', async () => {
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
          { slug: 'city-barbers', name: 'citybarbers.co', href: 'https://citybarbers.co/' },
          { slug: 'city-barbers-ace', name: 'citybarbers.co', href: 'https://citybarbers.co/' },
          {
            slug: 'city-barbers-ace',
            name: 'YouTube',
            href: 'https://www.youtube.com/@Ace.CityBarbers',
          },
          {
            slug: 'city-barbers-ace',
            name: 'Instagram',
            href: 'https://www.instagram.com/ace.citybarbers/',
          },
          {
            slug: 'city-barbers-ace',
            name: 'Book with Ace',
            href: 'https://getsquire.com/booking/book/city-barbers-salt-lake-city-salt-lake-city/barber/ace-32/services',
          },
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

  test(
    'Test_Case_8002_Adventures_CityBarbers_EmbedsTheHairCutHarryVideo',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the card embeds the YouTube feature, with a title for assistive tech', async () => {
        const embed = page.getByTestId('adventure-video-city-barbers');
        await expect
          .soft(embed)
          .toHaveAttribute('src', 'https://www.youtube.com/embed/zXcw3Cyc2GM');
        await expect.soft(embed).toHaveAttribute('title', /City Barbers/);
      });
    },
  );

  test(
    'Test_Case_8003_Adventures_CityBarbers_ShoutOutWritesItselfThenHandsOffToAce',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const card = home.adventureCard('city-barbers');
      const shoutOut = page.getByTestId('city-barbers-shoutout');
      const handoff = page.getByTestId('city-barbers-handoff');

      await test.step("Then the shop's own mark leads the card, and its words wait to be written", async () => {
        await expect
          .soft(card.locator('.adventure-media-mark img'))
          .toHaveAttribute('alt', 'City Barbers');
        await expect.soft(shoutOut).toHaveClass(/tw-waiting/);
        await expect.soft(shoutOut).toContainText('treats the work as a craft');
      });

      await test.step("When the card scrolls into view, the shout-out writes itself with the shop's own cursor", async () => {
        await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        // the mark is lazy — it only has pixels once the card is actually on screen
        await expect
          .poll(() =>
            card
              .locator('.adventure-media-mark img')
              .evaluate((img: HTMLImageElement) => img.naturalWidth),
          )
          .toBeGreaterThan(0);
        await expect(shoutOut).toHaveClass(/is-typing|tw-written/, { timeout: 15_000 });
        // The caret is a pair of shears, not the block the rest of the site
        // types with. Only the span currently being written into carries it,
        // and which span that is moves through the line — so this polls for it
        // rather than reading whichever one happens to be first.
        await expect
          .poll(
            () =>
              shoutOut.evaluate((el) => {
                const writing = el.querySelector('.tw-typed.is-writing');
                return writing ? getComputedStyle(writing, '::after').backgroundImage : '';
              }),
            { timeout: 15_000 },
          )
          .toContain('data:image/svg+xml');
      });

      await test.step('Then the hand-off waits its turn, and only then names the Ace', async () => {
        // sequential: nothing of the punchline shows while the setup is still typing
        if (await shoutOut.evaluate((el) => el.classList.contains('is-typing'))) {
          await expect.soft(handoff).toHaveClass(/tw-waiting/);
        }
        await expect(handoff).toHaveClass(/tw-written/, { timeout: 40_000 });
        await expect.soft(handoff).toContainText('The Ace of Quality');
        await expect.soft(handoff.locator('.handoff-name svg')).toBeVisible();
        await expect.soft(shoutOut).toHaveClass(/tw-written/);
      });

      await test.step("Then Ace's own card follows it, as the hand-off promised", async () => {
        await expect
          .soft(home.adventureCard('city-barbers-ace').locator('h3'))
          .toHaveText('The Ace of Quality');
      });
    },
  );
});
