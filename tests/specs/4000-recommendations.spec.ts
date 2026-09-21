import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// What It Tests: The Recommendations section's 10 cards each link a real
// name to a real LinkedIn profile and carry an actual quote.
// Why It Matters: Third-party endorsements only carry weight if a hiring
// manager can click through and verify the person is real — a dead or
// missing LinkedIn link quietly kills that trust.
test.describe('Recommendations', () => {
  const LETTER_AUTHORS = [
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
        for (const slug of LETTER_AUTHORS) {
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
        for (const slug of LETTER_AUTHORS) {
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

      await test.step('Then both incident cards read as their outcome from the start, reports already written', async () => {
        await expect.soft(home.recCard('quaid')).not.toHaveAttribute('data-status', /./);
        await expect.soft(home.quaidReport).not.toHaveClass(/is-typing/);
        await expect.soft(home.quaidGeneratedTest).toContainText('Test_Case_4004');
        await expect.soft(home.recCard('anonymous-user')).not.toHaveAttribute('data-status', /./);
        await expect.soft(home.incidentReport('anonymous')).not.toHaveClass(/is-typing/);
        await expect.soft(home.incidentGeneratedTest('anonymous')).toContainText('Test_Case_4006');
      });
    },
  );

  // What It Tests: A recommendation card only ever belongs to a real person.
  // Why It Matters: Quaid is a mannequin with 99+ years of experience — if he
  // can get a card, so can any bug that dresses the part.
  test(
    'Test_Case_4004_Recommendations_Quaid_IsNotAHuman',
    { tag: ['@smoke', '@data-integrity'] },
    async ({ page, request }) => {
      const home = new HomePage(page);
      const quaid = home.recCard('quaid');

      await test.step('Given the Recommendations chapter has loaded', async () => {
        await home.goto();
        await expect(home.recommendationLetters.first()).toBeVisible();
      });

      await test.step('Then Quaid carries the failed verdict, and is not counted as a letter', async () => {
        await expect(quaid, 'a card with no human behind it must fail').toHaveClass(
          /rec-card-failed/,
        );
        await expect(quaid, 'his outcome is declared in the markup, not inferred').toHaveAttribute(
          'data-outcome',
          'fail',
        );
        await expect(
          home.recommendationLetters,
          'only the people who wrote one are letters',
        ).toHaveCount(LETTER_AUTHORS.length);
      });

      await test.step('And the API has no record of him', async () => {
        const response = await request.get('/api/humans/quaid');
        expect(response.status(), 'a human record for a mannequin is a data-integrity bug').toBe(
          404,
        );
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
          .toContainText('Then Quaid carries the failed verdict, and is not counted as a letter');
        await expect
          .soft(home.quaidGeneratedTest)
          .toContainText("request.get('/api/humans/quaid')");
        await expect
          .soft(page.getByTestId('quaid-log-done').getByRole('link'))
          .toHaveAttribute('href', /tests\/specs\/4000-recommendations\.spec\.ts$/);
      });
    },
  );

  // What It Tests: An unidentified author can never hold a recommendation, and
  // the site takes no recommendation from one.
  // Why It Matters: A recommendation is worth exactly what its author's name is
  // worth. An anonymous one is an open door for anyone to write their own.
  test(
    'Test_Case_4006_Recommendations_AnonymousUser_IsBlocked',
    { tag: ['@smoke', '@security'] },
    async ({ page, request }) => {
      const home = new HomePage(page);
      const anonymous = home.recCard('anonymous-user');

      await test.step('Given the Recommendations chapter has loaded', async () => {
        await home.goto();
        await expect(home.recommendationLetters.first()).toBeVisible();
      });

      await test.step('Then the unidentified author is blocked, with no identity to link', async () => {
        await expect(
          anonymous,
          'an author with no identity is blocked, not merely failed',
        ).toHaveClass(/rec-card-blocked/);
        await expect(
          anonymous.locator('.rec-link-linkedin'),
          'no identity, no profile to link',
        ).toHaveCount(0);
        await expect(
          home.recommendationLetters,
          'only named authors are counted as letters',
        ).toHaveCount(LETTER_AUTHORS.length);
      });

      await test.step('And an anonymous submission is refused at the door', async () => {
        const response = await request.post('/api/recommendations', {
          data: { author: 'Anonymous User', text: 'Trust me.' },
        });
        expect(
          response.status(),
          'nothing on this site accepts an unauthorized author',
        ).toBeGreaterThanOrEqual(400);
      });
    },
  );

  test(
    'Test_Case_4007_Recommendations_AnonymousUser_IsBlockedAndWritesItsOwnTestCase',
    { tag: '@regression' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const card = home.recCard('anonymous-user');

      await test.step("Given their verdict is pending like everyone else's", async () => {
        await expect.soft(card).toHaveAttribute('data-status', 'pending');
        await expect.soft(home.incidentReport('anonymous')).toBeHidden();
      });

      await test.step('When the card scrolls into view, the decrypt blocks them', async () => {
        await card.scrollIntoViewIfNeeded();
        await expect(card).toHaveAttribute('data-status', 'blocked', { timeout: 10_000 });
        await expect.soft(card.locator('blockquote p')).toContainText('Unauthorized');
      });

      await test.step('Then the security protocol runs, recording and blocking the IP', async () => {
        await expect(page.getByTestId('anonymous-log-blocked')).toBeVisible();
        await expect(
          home.incidentReport('anonymous').locator('.qa-line', { hasText: 'User IP blocked' }),
        ).toBeVisible({
          timeout: 10_000,
        });
      });

      await test.step('Then it writes the security test case above, and links the spec it lives in', async () => {
        await expect(home.incidentReport('anonymous')).toHaveClass(/is-complete/, {
          timeout: 30_000,
        });
        await expect.soft(home.incidentGeneratedTest('anonymous')).toContainText('Test_Case_4006');
        await expect
          .soft(home.incidentGeneratedTest('anonymous'))
          .toContainText("request.post('/api/recommendations'");
        await expect
          .soft(page.getByTestId('anonymous-log-done').getByRole('link'))
          .toHaveAttribute('href', /tests\/specs\/4000-recommendations\.spec\.ts$/);
      });
    },
  );
});
