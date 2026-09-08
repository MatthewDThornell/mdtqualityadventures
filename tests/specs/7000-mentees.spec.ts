import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The "Where Are They Now?" mentee grid (10 people, one
// intentionally unlinked) and the "In Their Own Words" testimonial cards
// nested inside this same section.
// Why It Matters: This section is the throughline of the mentoring stat
// callout ("15+ people mentored") — broken links or a missing testimonial
// undercut the one section built entirely around other people vouching for
// Matthew.
test.describe('Mentees', () => {
  const LINKED_MENTEES: Record<string, string> = {
    'vivian-nguyen': 'https://www.linkedin.com/in/vivian-nguyen-bb2694244/',
    'tristan-lundgreen': 'https://www.linkedin.com/in/tristan-lundgreen/',
    'stockton-nielson': 'https://www.linkedin.com/in/stockton-nielson/',
    'cameron-smith': 'https://www.linkedin.com/in/cameron-jay-smith/',
    'tyler-high': 'https://www.linkedin.com/in/tyler-high-a6b352388/',
    'alex-fergestad': 'https://www.linkedin.com/in/alex-fergestad/',
    'aaron-forkel': 'https://www.linkedin.com/in/aaron-forkel/',
    'callum-payne': 'https://www.linkedin.com/in/callumpayne-sw/',
    'cj-johnson': 'https://www.linkedin.com/in/cj-j-825266103',
  };
  const IN_THEIR_OWN_WORDS_SLUGS = [
    'vivian-nguyen',
    'alex-fergestad',
    'aaron-forkel',
    'tristan-lundgreen',
    'callum-payne',
    'stockton-nielson',
    'cj-johnson',
  ];

  test(
    'Test_Case_7000_Mentees_Grid_AreVisibleWithRealLinkedInProfiles',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then all 10 mentee cards are visible, including the unlinked one', async () => {
        await expect.soft(home.menteeCard('quaid')).toBeVisible();
        await expect.soft(home.menteeCard('quaid').getByRole('link')).toHaveCount(0);
        for (const slug of Object.keys(LINKED_MENTEES)) {
          await expect.soft(home.menteeCard(slug)).toBeVisible();
        }
      });

      await test.step('Then every linked mentee points to their real LinkedIn profile', async () => {
        for (const [slug, href] of Object.entries(LINKED_MENTEES)) {
          await expect
            .soft(home.menteeCard(slug).locator('.mentee-name a'))
            .toHaveAttribute('href', href);
        }
      });
    },
  );

  test(
    'Test_Case_7001_Mentees_InTheirOwnWords_QuotesArePresent',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then every "In Their Own Words" testimonial has a real quote', async () => {
        for (const slug of IN_THEIR_OWN_WORDS_SLUGS) {
          await expect.soft(home.recCard(slug)).toBeVisible();
          await expect.soft(home.recCard(slug).locator('blockquote')).not.toBeEmpty();
        }
      });
    },
  );
});
