import { test, expect, type Locator } from '@playwright/test';
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
    'quality-knights',
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
          .poll(
            () =>
              card
                .locator('.adventure-media-mark img')
                .evaluate((img: HTMLImageElement) => img.naturalWidth),
            // a lazy image, fetched only once the card is on screen, and slow
            // to arrive when four workers share one dev server
            { timeout: 15_000 },
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

// What It Tests: The two boards on the Quality Knights card play one real game
// forward, in step with each other and from opposite sides, and with motion
// turned off simply show the finished game instead.
// Why It Matters: The moves are generated from a PGN by
// scripts/generate-chess-replay.mjs, and the runtime deliberately knows no
// chess: it slides a piece and then applies the position it was handed. If the
// generated data and the player ever disagree about which square is which, the
// boards would still animate — they would just be playing nonsense. Counting
// captures is the cheapest way to prove the position is really being applied,
// and comparing the two boards is the cheapest way to prove the flipped one is
// the same game rather than a second one running loose.
test.describe('Adventures — the Quality Knights boards', () => {
  // the piece on a square, read off a board in its own display order
  const readBoard = (board: Locator) =>
    board.locator('.chess-piece').evaluateAll((els) => els.map((el) => el.textContent ?? ''));

  test(
    'Test_Case_8004_Adventures_ChessReplay_PlaysOneGameOnBothBoards',
    { tag: '@regression' },
    async ({ page }) => {
      test.slow();
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then two boards are drawn, 64 squares and 32 pieces each', async () => {
        await home.chessReplay.scrollIntoViewIfNeeded();
        await expect.soft(home.chessBoards).toHaveCount(2);
        await expect.soft(home.chessSquares).toHaveCount(128);
        await expect.soft(home.chessOccupiedSquares).toHaveCount(64);
      });

      await test.step('Then the second board is the first one turned around, not a different game', async () => {
        const [first, second] = await Promise.all([
          readBoard(home.chessBoards.nth(0)),
          readBoard(home.chessBoards.nth(1)),
        ]);
        expect.soft(second).toEqual([...first].reverse());
      });

      await test.step('When it runs, Then the game advances ply by ply', async () => {
        const early = await home.chessPly();
        expect.soft(Number(early)).toBeGreaterThanOrEqual(0);
        await expect.poll(() => home.chessPly(), { timeout: 20_000 }).not.toBe(early);
      });

      await test.step('Then pieces come off both boards, so the real position is being applied', async () => {
        // the game's first capture is 4...Nxe4; nothing returns to the board
        // once taken, so the count only ever falls
        await expect
          .poll(() => home.chessOccupiedSquares.count(), { timeout: 40_000 })
          .toBeLessThan(64);
      });

      await test.step('Then the two boards are still mirrors of each other mid-game', async () => {
        const [first, second] = await Promise.all([
          readBoard(home.chessBoards.nth(0)),
          readBoard(home.chessBoards.nth(1)),
        ]);
        expect.soft(second).toEqual([...first].reverse());
      });
    },
  );

  test(
    'Test_Case_8005_Adventures_ChessReplay_ReducedMotion_ShowsTheFinishedGame',
    { tag: '@regression' },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const home = new HomePage(page);
      await home.goto();

      await test.step('Then the boards stand at the final position of the game', async () => {
        await home.chessReplay.scrollIntoViewIfNeeded();
        // 102 plies in the generated game, so the end of it
        await expect.soft(home.chessReplay).toHaveAttribute('data-ply', '102');
        const left = await home.chessOccupiedSquares.count();
        expect.soft(left, `${left} pieces left across both boards`).toBeLessThan(64);
      });

      await test.step('Then nothing moves, because nothing is animating', async () => {
        const before = await home.chessPly();
        await page.waitForTimeout(3000);
        expect.soft(await home.chessPly()).toBe(before);
      });
    },
  );
});
