import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// What It Tests: That the Content-Security-Policy Netlify serves actually
// allows everything the built site loads — checked against the source, not a
// browser.
// Why It Matters: The dev server and `vite preview` send no CSP at all, so a
// directive that blocks a real asset fails only in production, silently, and
// only for the thing it blocked. That is exactly how `img-src 'self'` came to
// block every inline-SVG mark in the stylesheet — the chapter openers' binary,
// the barber shears, the Detail Guy's van and rag — while every local check,
// and every computed-style assertion, still passed: the CSS said
// `url("data:image/svg+xml,…")` right up until the browser refused to fetch it.
test.describe('Security headers', () => {
  // the specs are ES modules, so the repo root comes from import.meta
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

  const csp = (() => {
    const toml = read('netlify.toml');
    const line = toml.match(/Content-Security-Policy\s*=\s*"([^"]+)"/);
    if (!line) throw new Error('no Content-Security-Policy in netlify.toml');
    return Object.fromEntries(
      line[1]
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const [name, ...values] = part.split(/\s+/);
          return [name, values];
        }),
    ) as Record<string, string[]>;
  })();

  test(
    'Test_Case_15000_Headers_CSP_AllowsEverythingTheSiteActuallyLoads',
    { tag: '@smoke' },
    async () => {
      await test.step('Then inline-SVG marks in the stylesheet are allowed as images', async () => {
        const css = read('src/style.css');
        const dataUris = (css.match(/url\('data:image\//g) ?? []).length;
        // if this ever drops to zero the directive below can be tightened again
        expect.soft(dataUris, 'style.css still carries inline-SVG marks').toBeGreaterThan(0);
        expect
          .soft(csp['img-src'], "img-src must allow the stylesheet's data: URIs")
          .toContain('data:');
        expect.soft(csp['img-src']).toContain("'self'");
      });

      await test.step('Then the Google Fonts the pages ask for are allowed', async () => {
        const html = read('index.html');
        expect.soft(html).toContain('https://fonts.googleapis.com');
        expect.soft(csp['style-src']).toContain('https://fonts.googleapis.com');
        expect.soft(csp['font-src']).toContain('https://fonts.gstatic.com');
      });

      await test.step("Then the pages' YouTube embeds are allowed to frame", async () => {
        const embeds = ['index.html', 'test-automation-university.html'].some((page) =>
          read(page).includes('https://www.youtube.com/embed/'),
        );
        expect.soft(embeds, 'a page embeds YouTube').toBe(true);
        expect.soft(csp['frame-src']).toContain('https://www.youtube.com');
      });

      await test.step('Then the directives that keep the site safe are still strict', async () => {
        expect.soft(csp['script-src']).toEqual(["'self'"]);
        expect.soft(csp['object-src']).toEqual(["'none'"]);
        expect.soft(csp['frame-ancestors']).toEqual(["'none'"]);
        expect.soft(csp['default-src']).toEqual(["'self'"]);
      });
    },
  );
});
