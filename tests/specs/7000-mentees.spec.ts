import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The "Where Are They Now?" mentee grid (10 people, one
// intentionally unlinked), the horizontal spotlight rail that tells a couple of
// those stories at length, and the "In Their Own Words" testimonial cards
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
    'Test_Case_7002_Mentees_Spotlight_PagesThroughTheStoryRail',
    { tag: '@smoke' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the rail opens on Tyler, with the back arrow already spent', async () => {
        await expect.soft(home.spotlightCard('tyler-high')).toBeVisible();
        await expect.soft(home.spotlightCard('cj-johnson')).toBeVisible();
        await expect.soft(home.spotlightPager).toHaveText('1 / 2');
        await expect.poll(() => home.spotlightSlideOffset('tyler-high')).toBeLessThan(12);
        await expect.soft(home.spotlightPrevBtn).toBeDisabled();
        await expect.soft(home.spotlightNextBtn).toBeEnabled();
      });

      await test.step('When I page forward, Then CJ slides into place and the arrows flip', async () => {
        await home.spotlightNextBtn.click();
        await expect(home.spotlightPager).toHaveText('2 / 2');
        await expect.poll(() => home.spotlightSlideOffset('cj-johnson')).toBeLessThan(12);
        await expect.soft(home.spotlightNextBtn).toBeDisabled();
        await expect.soft(home.spotlightPrevBtn).toBeEnabled();
      });

      await test.step('When I page back, Then Tyler returns', async () => {
        await home.spotlightPrevBtn.click();
        await expect(home.spotlightPager).toHaveText('1 / 2');
        await expect.poll(() => home.spotlightSlideOffset('tyler-high')).toBeLessThan(12);
      });
    },
  );

  test(
    'Test_Case_7003_Mentees_Spotlight_OutboundLinksPointToRealDestinations',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await test.step("Then each spotlight links out to that person's own sites", async () => {
        const linkChecks: Array<{ slug: string; name: RegExp | string; href: string }> = [
          { slug: 'tyler-high', name: 'highbjorn.com', href: 'https://highbjorn.com/' },
          {
            slug: 'tyler-high',
            name: 'Instagram',
            href: 'https://www.instagram.com/highbjorndetail',
          },
          {
            slug: 'tyler-high',
            name: 'Facebook',
            href: 'https://www.facebook.com/share/1BuYHsMVHL/',
          },
          { slug: 'tyler-high', name: 'Detail your Car', href: 'https://highbjorn.com/' },
          {
            slug: 'cj-johnson',
            name: 'LinkedIn',
            href: 'https://www.linkedin.com/in/cj-j-825266103',
          },
        ];
        for (const { slug, name, href } of linkChecks) {
          await expect
            .soft(home.spotlightCard(slug).getByRole('link', { name }))
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

  test(
    'Test_Case_7004_Mentees_DetailGuy_TestimonyTypesItselfThenGetsPolished',
    { tag: '@regression' },
    async ({ page }) => {
      // the whole testimony types out, line after line, at a pace meant to be
      // watched (about 36s), and is then buffed: minutes of animation by design
      test.setTimeout(180_000);
      const home = new HomePage(page);
      await home.goto();
      const body = home.spotlightCard('tyler-high').locator('.adventure-body');
      const lines = body.locator('> p:not(.card-meta):not(.card-follow)');
      const opening = 'Tyler and I have known each other since we were kids';

      await test.step('Given the testimony waits unwritten, with every word already in the page', async () => {
        await expect.soft(lines.first()).toHaveClass(/tw-waiting/);
        await expect.soft(lines.first()).toContainText(opening);
        await expect.soft(body).not.toHaveClass(/is-polish/);
      });

      await test.step('When the card scrolls into view, his van drives the first line out', async () => {
        await body.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expect(lines.first()).toHaveClass(/is-typing|tw-written/, { timeout: 20_000 });
        // the cursor is his Subaru, not the block the rest of the site types with
        await expect
          .poll(
            () =>
              body.evaluate((el) => {
                const writing = el.querySelector('.tw-typed.is-writing');
                return writing ? getComputedStyle(writing, '::after').backgroundImage : '';
              }),
            { timeout: 20_000 },
          )
          .toContain('data:image/svg+xml');
      });

      await test.step('Then every line lands, in order, with its text intact', async () => {
        const count = await lines.count();
        await expect(lines.nth(count - 1)).toHaveClass(/tw-written/, { timeout: 120_000 });
        for (let i = 0; i < count; i++) {
          await expect.soft(lines.nth(i)).toHaveClass(/tw-written/);
        }
        await expect.soft(lines.first()).toContainText(opening);
        await expect.soft(body.locator('.tw-typed, .tw-pending')).toHaveCount(0);
      });

      await test.step('Then the rag passes over it and leaves the card polished', async () => {
        await expect(body).toHaveClass(/is-polished/, { timeout: 30_000 });
        // the pass is decoration: aria-hidden, and it took nothing out of the card
        await expect.soft(body.locator('.polish-pass')).toHaveAttribute('aria-hidden', 'true');
        await expect.soft(lines.first()).toContainText(opening);
        await expect.soft(lines.last()).toBeVisible();
      });
    },
  );

  test(
    'Test_Case_7005_Mentees_DetailGuy_ReducedMotion_ReadsWithoutTheShow',
    { tag: '@regression' },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const home = new HomePage(page);
      await home.goto();
      const body = home.spotlightCard('tyler-high').locator('.adventure-body');

      await test.step('Then nothing waits, nothing types, and no rag is built', async () => {
        await expect.soft(body.locator('.tw-waiting')).toHaveCount(0);
        await expect.soft(body.locator('.polish-pass')).toHaveCount(0);
        await expect.soft(body).not.toHaveClass(/is-polish/);
        await expect
          .soft(body.locator('> p:not(.card-meta):not(.card-follow)').first())
          .toContainText('Tyler and I have known each other since we were kids');
      });
    },
  );
});
