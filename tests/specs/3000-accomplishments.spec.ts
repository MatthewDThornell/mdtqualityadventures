import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: Every accomplishment card is visible and, where it names a
// real employer/organization, links to that organization's actual site.
// Why It Matters: These cards are the proof behind the resume's claims — a
// broken or missing company link undercuts the credibility they're meant to
// build.
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
});
