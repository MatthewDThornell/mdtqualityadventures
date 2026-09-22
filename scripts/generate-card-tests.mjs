// Writes each recommendation's and accomplishment's own test case into
// index.html — the closed <details class="rec-test"> above the text that
// src/rec-precheck.js types out and passes before the text decrypts. The
// tests are illustrative (they never run) but they are real code, and the
// suite speaks several languages: cards take turns in Playwright TypeScript,
// Playwright Python, Cypress, Playwright .NET and Robot Framework, each
// written the way that framework's own suites are written. Idempotent —
// re-run after adding, removing or editing a card:
//   node scripts/generate-card-tests.mjs
// Every existing block is stripped and regenerated from the card's markup
// (name, title, company, letter, photo, first words of the text), so a
// card's test is always the test for what the card actually says.
import { readFileSync, writeFileSync } from 'node:fs';

const PAGE = 'index.html';
const INDENT = '                ';

// ---------- languages ----------
// The order is the order recommendation cards cycle through.
const LANGUAGES = {
  ts: { label: 'Playwright · TypeScript', logo: 'playwright.svg' },
  py: { label: 'Playwright · Python', logo: 'python.svg' },
  cy: { label: 'Cypress · JavaScript', logo: 'cypress.svg' },
  cs: { label: 'Playwright · C#', logo: 'csharp.svg' },
  rf: { label: 'Robot Framework', logo: 'robotframework-dark.svg' },
};
const CYCLE = Object.keys(LANGUAGES);

// Accomplishments are written in the tool the work itself was done in.
const ACCOMPLISHMENT_LANGUAGE = {
  'veterans-united-coverage': 'ts', // the Playwright framework built from scratch
  'werner-reporting': 'cs', // Werner's .NET shop
  'conexed-migration': 'cy', // the 400 tests migrated into Cypress
  'seekwell-stabilizing': 'py',
  'cast-speaking': 'rf', // a talk about asking questions, in the framework that reads like them
};

// ---------- text helpers ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decodeEntities = (s) =>
  s
    .replace(/&middot;/g, '·')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const pascal = (s) =>
  s
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
// Test_Case_4102_Recommendations_AlexFergestad_LetterRenders → test_case_4102_recommendations_alex_fergestad_letter_renders
const snake = (s) =>
  s
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Za-z])(\d)/g, '$1_$2')
    .replace(/(\d)([A-Za-z])/g, '$1_$2')
    .replace(/__+/g, '_')
    .toLowerCase();
const wbr = (name) => name.replace(/_/g, '_<wbr />');
// the first words of a text, for a contains-text check — up to seven, never
// ending on a word that leaves the phrase hanging ("…reporting in Power")
const STOP = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'from',
  'by',
  'into',
  'as',
  'is',
  'was',
  'his',
]);
function excerptOf(text) {
  const words = text.split(' ').slice(0, 7);
  while (words.length > 3 && STOP.has(words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '')))
    words.pop();
  return words.join(' ').replace(/[,;:]$/, '');
}

// quoting per language — an apostrophe in the text never becomes an escape
const q = {
  ts: (s) => (s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replace(/'/g, "\\'")}'`),
  py: (s) => (s.includes('"') && !s.includes("'") ? `'${s}'` : `"${s.replace(/"/g, '\\"')}"`),
  cs: (s) => `"${s.replace(/"/g, '\\"')}"`,
};
q.cy = q.ts;

// ---------- highlighting ----------
// One tokenizer, four grammars: comments and strings are cut out first, then
// keywords, numbers and the test's own name are marked in what remains.
const GRAMMAR = {
  ts: {
    cut: /(\/\/[^\n]*|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\/(?:\\.|[^/\\\n])+\/[gimsuy]*)/,
    kw: /\b(const|let|await|async|new|import|from|export|return)\b/g,
    fn: /^(\s*)(test|describe|it)\(/,
  },
  py: {
    cut: /(#[^\n]*|[rf]?"(?:[^"\\\n]|\\.)*"|[rf]?'(?:[^'\\\n]|\\.)*')/,
    kw: /\b(def|import|from|as|with|assert|return|True|False|None|in|not)\b|@[\w.]+(?:\([^)]*\))?/g,
    fn: /^(\s*def\s+)(\w+)\(/,
  },
  cs: {
    // an attribute is cut out whole, string argument included, and coloured as a keyword
    cut: /(\/\/[^\n]*|\[[A-Za-z]+(?:\([^)]*\))?(?:,\s*[A-Za-z]+(?:\([^)]*\))?)*\]|[@$]?"(?:[^"\\\n]|\\.)*")/,
    kw: /\b(public|class|async|await|var|new|using|namespace|Task|void|return)\b/g,
    fn: /^(\s*public async Task\s+)(\w+)\(/,
  },
  rf: {
    cut: /(#[^\n]*|\*\*\* [A-Za-z ]+ \*\*\*|\$\{[^}]+\}|\[[A-Za-z ]+\])/,
    kw: /^\s*(Library|Resource|Test Tags|Suite Setup|Given|When|Then|And)\b/g,
    fn: null,
  },
};
GRAMMAR.cy = GRAMMAR.ts;

function highlight(code, lang) {
  const g = GRAMMAR[lang];
  return code
    .split('\n')
    .map((line) => {
      if (lang === 'rf' && /^\*\*\* /.test(line)) return `<span class="tok-kw">${esc(line)}</span>`;
      // a Robot test case's name is the unindented line under *** Test Cases ***
      if (lang === 'rf' && /^Test_Case_/.test(line))
        return `<span class="tok-fn">${esc(line)}</span>`;
      const fnMatch = g.fn && line.match(g.fn);
      const parts = line.split(g.cut);
      let out = parts
        .map((part, i) => {
          if (i % 2 === 1) {
            const cls = /^(\/\/|#)/.test(part)
              ? 'tok-comment'
              : /^\*\*\*|^\[/.test(part)
                ? 'tok-kw'
                : /^\$\{/.test(part)
                  ? 'tok-num'
                  : 'tok-str';
            return `<span class="${cls}">${esc(part)}</span>`;
          }
          return esc(part)
            .replace(g.kw, (m) => `<span class="tok-kw">${m}</span>`)
            .replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>');
        })
        .join('');
      if (fnMatch) {
        const name = esc(fnMatch[2]);
        out = out.replace(name + '(', `<span class="tok-fn">${name}</span>(`);
      }
      return out;
    })
    .join('\n');
}

// ---------- the model ----------
// A step is a title and a list of checks; each language renders the same
// checks its own way. A target is the card itself ({ card: true }), something
// inside it ({ sel, po }) — po names the page-object accessor Playwright
// suites would use — or a page-level test id ({ testid }).
const card = { card: true };
const inCard = (sel, po) => ({ sel, po });
const byTestId = (testid) => ({ testid });

const checks = {
  headingVisible: (name) => ({ kind: 'headingVisible', name }),
  attrMatches: (target, attr, pattern) => ({ kind: 'attrMatches', target, attr, pattern }),
  attrEquals: (target, attr, value) => ({ kind: 'attrEquals', target, attr, value }),
  textEquals: (target, value) => ({ kind: 'textEquals', target, value }),
  textContains: (target, value) => ({ kind: 'textContains', target, value }),
  imagePainted: (target) => ({ kind: 'imagePainted', target }),
};

// ---------- renderers ----------
// Each takes { testName, slug, cardAccessor, steps } and returns code.
// cardAccessor is the page-object method that returns the card (recCard /
// accomplishmentCard); languages without a page object use the test id.

function renderTs({ testName, slug, cardAccessor, steps }) {
  const s = q.ts;
  const loc = (t) => {
    if (t.card) return 'card';
    if (t.testid) return `page.getByTestId(${s(t.testid)})`;
    if (t.po) return `home.${t.po}(${s(slug)})`;
    return `card.locator(${s(t.sel)})`;
  };
  const check = (c) => {
    switch (c.kind) {
      case 'headingVisible':
        return `await expect(card.getByRole('heading', { name: ${s(c.name)} })).toBeVisible();`;
      case 'attrMatches':
        return `await expect(${loc(c.target)}).toHaveAttribute(${s(c.attr)}, /${c.pattern}/);`;
      case 'attrEquals':
        return c.attr === 'data-status'
          ? `await expect(card, 'an entry that read in full is a pass').toHaveAttribute('data-status', 'pass');`
          : `await expect(${loc(c.target)}).toHaveAttribute(${s(c.attr)}, ${s(c.value)});`;
      case 'textEquals':
        return `await expect(${loc(c.target)}).toHaveText(${s(c.value)});`;
      case 'textContains':
        return `await expect(${loc(c.target)}).toContainText(${s(c.value)});`;
      case 'imagePainted':
        return `expect(await ${loc(c.target)}.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);`;
    }
  };
  const body = steps
    .map(
      (st) => `  await test.step(${s(st.title)}, async () => {
${st.checks.map((c) => `    ${check(c)}`).join('\n')}
  });`,
    )
    .join('\n\n');
  return `test(${s(testName)}, { tag: '@smoke' }, async ({ page }) => {
  const home = new HomePage(page);
  const card = home.${cardAccessor}(${s(slug)});

${body}
});`;
}

// the Python page object's names for the accessors the TypeScript one has
const PY_PO = {
  recCard: 'rec_card',
  recLinkedIn: 'rec_linkedin',
  recCompany: 'rec_company',
  accomplishmentCard: 'accomplishment_card',
};

function renderPy({ testName, slug, cardAccessor, steps }) {
  const s = q.py;
  const loc = (t) => {
    if (t.card) return 'card';
    if (t.testid) return `page.get_by_test_id(${s(t.testid)})`;
    if (t.po) return `home.${PY_PO[t.po] ?? snake(t.po)}(${s(slug)})`;
    return `card.locator(${s(t.sel)})`;
  };
  const check = (c) => {
    switch (c.kind) {
      case 'headingVisible':
        return `expect(card.get_by_role("heading", name=${s(c.name)})).to_be_visible()`;
      case 'attrMatches':
        return `expect(${loc(c.target)}).to_have_attribute(${s(c.attr)}, re.compile(r"${c.pattern}"))`;
      case 'attrEquals':
        return c.attr === 'data-status'
          ? `expect(card).to_have_attribute("data-status", "pass")  # an entry that read in full is a pass`
          : `expect(${loc(c.target)}).to_have_attribute(${s(c.attr)}, ${s(c.value)})`;
      case 'textEquals':
        return `expect(${loc(c.target)}).to_have_text(${s(c.value)})`;
      case 'textContains':
        return `expect(${loc(c.target)}).to_contain_text(${s(c.value)})`;
      case 'imagePainted':
        return `assert ${loc(c.target)}.evaluate("img => img.naturalWidth") > 0`;
    }
  };
  const body = steps
    .map((st) => `    # ${st.title}\n${st.checks.map((c) => `    ${check(c)}`).join('\n')}`)
    .join('\n\n');
  const needsRe = steps.some((st) => st.checks.some((c) => c.kind === 'attrMatches'));
  return `${needsRe ? 'import re\n' : ''}import pytest
from playwright.sync_api import Page, expect

from pages.home_page import HomePage


@pytest.mark.smoke
def ${snake(testName)}(page: Page):
    home = HomePage(page)
    card = home.${PY_PO[cardAccessor] ?? snake(cardAccessor)}(${s(slug)})

${body}`;
}

function renderCy({ testName, cardTestId, steps }) {
  const s = q.cy;
  const sel = (t) => {
    if (t.testid) return `cy.get(${s(`[data-testid="${t.testid}"]`)})`;
    if (t.card) return `cy.get('@card')`;
    return `cy.get('@card').find(${s(t.sel)})`;
  };
  const check = (c) => {
    switch (c.kind) {
      case 'headingVisible':
        return `cy.get('@card').contains('h3', ${s(c.name)}).should('be.visible');`;
      case 'attrMatches':
        return `${sel(c.target)}.should('have.attr', ${s(c.attr)}).and('match', /${c.pattern}/);`;
      case 'attrEquals':
        return c.attr === 'data-status'
          ? `cy.get('@card').should('have.attr', 'data-status', 'pass'); // an entry that read in full is a pass`
          : `${sel(c.target)}.should('have.attr', ${s(c.attr)}, ${s(c.value)});`;
      case 'textEquals':
        return `${sel(c.target)}.should('have.text', ${s(c.value)});`;
      case 'textContains':
        return `${sel(c.target)}.should('contain.text', ${s(c.value)});`;
      case 'imagePainted':
        return `${sel(c.target)}.should(($img) => expect($img[0].naturalWidth).to.be.greaterThan(0));`;
    }
  };
  const body = steps
    .map(
      (st) => `    cy.log(${s(st.title)});\n${st.checks.map((c) => `    ${check(c)}`).join('\n')}`,
    )
    .join('\n\n');
  return `describe('Home', { tags: ['@smoke'] }, () => {
  it(${s(testName)}, () => {
    cy.visit('/');
    cy.get(${s(`[data-testid="${cardTestId}"]`)}).as('card');

${body}
  });
});`;
}

function renderCs({ testName, slug, cardAccessor, steps }) {
  const s = q.cs;
  const Pascal = (name) => name[0].toUpperCase() + name.slice(1);
  const loc = (t) => {
    if (t.card) return 'card';
    if (t.testid) return `Page.GetByTestId(${s(t.testid)})`;
    if (t.po) return `home.${Pascal(t.po)}(${s(slug)})`;
    return `card.Locator(${s(t.sel)})`;
  };
  const check = (c) => {
    switch (c.kind) {
      case 'headingVisible':
        return `await Expect(card.GetByRole(AriaRole.Heading, new() { Name = ${s(c.name)} })).ToBeVisibleAsync();`;
      case 'attrMatches':
        return `await Expect(${loc(c.target)}).ToHaveAttributeAsync(${s(c.attr)}, new Regex(@"${c.pattern.replace(/\\\//g, '/')}"));`;
      case 'attrEquals':
        return c.attr === 'data-status'
          ? `await Expect(card).ToHaveAttributeAsync("data-status", "pass"); // an entry that read in full is a pass`
          : `await Expect(${loc(c.target)}).ToHaveAttributeAsync(${s(c.attr)}, ${s(c.value)});`;
      case 'textEquals':
        return `await Expect(${loc(c.target)}).ToHaveTextAsync(${s(c.value)});`;
      case 'textContains':
        return `await Expect(${loc(c.target)}).ToContainTextAsync(${s(c.value)});`;
      case 'imagePainted':
        return `Assert.That(await ${loc(c.target)}.EvaluateAsync<int>("img => img.naturalWidth"), Is.GreaterThan(0));`;
    }
  };
  const body = steps
    .map(
      (st) => `        // ${st.title}\n${st.checks.map((c) => `        ${check(c)}`).join('\n')}`,
    )
    .join('\n\n');
  return `[TestFixture]
public class HomeTests : PageTest
{
    [Test, Category("smoke")]
    public async Task ${testName}()
    {
        var home = new HomePage(Page);
        var card = home.${Pascal(cardAccessor)}(${s(slug)});

${body}
    }
}`;
}

function renderRf({ testName, cardTestId, steps, doc }) {
  const sel = (t) => {
    if (t.testid) return `[data-testid="${t.testid}"]`;
    if (t.card) return '${card}';
    return `\${card} ${t.sel}`;
  };
  const check = (c) => {
    switch (c.kind) {
      case 'headingVisible':
        return [
          `Get Element States    \${card} h3    contains    visible`,
          `Get Text    \${card} h3    ==    ${c.name}`,
        ];
      case 'attrMatches':
        return [`Get Attribute    ${sel(c.target)}    ${c.attr}    matches    ${c.pattern}`];
      case 'attrEquals':
        return c.attr === 'data-status'
          ? [
              `Get Attribute    \${card}    data-status    ==    pass    # an entry that read in full is a pass`,
            ]
          : [
              `Get Attribute    ${sel(c.target)}    ${c.attr}    ==    ${c.value === '' ? '${EMPTY}' : c.value}`,
            ];
      case 'textEquals':
        return [`Get Text    ${sel(c.target)}    ==    ${c.value}`];
      case 'textContains':
        return [`Get Text    ${sel(c.target)}    contains    ${c.value}`];
      case 'imagePainted':
        return [
          `\${width}=    Evaluate JavaScript    ${sel(c.target)}    (img) => img.naturalWidth`,
          `Should Be True    \${width} > 0`,
        ];
    }
  };
  const body = steps
    .map(
      (st) =>
        `    # ${st.title}\n${st.checks
          .flatMap(check)
          .map((l) => `    ${l}`)
          .join('\n')}`,
    )
    .join('\n\n');
  return `*** Settings ***
Library         Browser
Resource        ../resources/home_page.resource
Test Tags       smoke

*** Test Cases ***
${testName}
    [Documentation]    ${doc}
    Given The Home Page Is Open
    \${card}=    Set Variable    [data-testid="${cardTestId}"]

${body}`;
}

const RENDER = { ts: renderTs, py: renderPy, cy: renderCy, cs: renderCs, rf: renderRf };

// ---------- the block ----------
function detailsBlock({ lang, testid, testName, steps, code }) {
  const { label, logo } = LANGUAGES[lang];
  return `<details class="rec-test" data-testid="${testid}" data-lang="${lang}">
${INDENT}  <summary>
${INDENT}    <span class="rec-test-lang"><img src="/images/logos/tech/${logo}" width="14" height="14" alt="" />${label}</span>
${INDENT}    <span class="rec-test-name">${wbr(testName)}</span>
${INDENT}    <span class="rec-test-status">${steps.length} steps</span>
${INDENT}  </summary>
${INDENT}  <pre class="qa-code"><code>${highlight(code, lang)}</code></pre>
${INDENT}</details>`;
}

// ---------- read, strip, regenerate ----------
let html = readFileSync(PAGE, 'utf8');
const crlf = html.includes('\r\n');
html = html.replace(/\r\n/g, '\n');
const stripped = (html.match(/<details class="rec-test"/g) || []).length;
html = html.replace(/\n\s*<details class="rec-test"[\s\S]*?<\/details>/g, '');
if ((html.match(/<details class="rec-test"/g) || []).length !== 0) throw new Error('strip failed');

// recommendations: the plain rec-cards (the incident cards write their own tests)
let recs = 0;
html = html.replace(
  /(<article class="rec-card" data-testid="rec-card-([^"]+)">)([\s\S]*?)(\n\s*<blockquote>)/g,
  (m, open, slug, body, bqOpen, offset) => {
    const name = decodeEntities(body.match(/<h3><a [^>]*>([^<]+)<\/a><\/h3>/)[1]);
    const title = decodeEntities(body.match(/<p class="rec-title">([^<]+)<\/p>/)[1]);
    const rest = html.slice(offset + m.length, html.indexOf('</article>', offset));
    const together = rest.match(/title="Worked together at ([^"]+)"/)?.[1];
    const nowAt = rest.match(/title="Now at ([^"]+)"/)?.[1];
    const hasLetter = rest.includes(`data-testid="rec-letter-${slug}"`);
    const quoteText = decodeEntities(rest.match(/^\s*<p>([\s\S]*?)<\/p>/)[1]).replace(/^[“"]/, '');
    const excerpt = excerptOf(quoteText);
    const first = name.split(' ')[0];
    recs++;
    const lang = CYCLE[(recs - 1) % CYCLE.length];

    const steps = [
      {
        title: `Then ${name}'s name loads and displays, linked to their LinkedIn profile`,
        checks: [
          checks.headingVisible(name),
          checks.attrMatches(
            inCard('.rec-link-linkedin', 'recLinkedIn'),
            'href',
            'linkedin\\.com\\/in\\/',
          ),
        ],
      },
    ];
    if (together) {
      steps.push({
        title: 'Then their title and the company we worked at together are shown',
        checks: [
          checks.textEquals(inCard('.rec-title'), title),
          checks.attrEquals(
            inCard('.rec-link-company', 'recCompany'),
            'title',
            `Worked together at ${together}`,
          ),
        ],
      });
    } else if (nowAt) {
      steps.push({
        title: 'Then their title and where they are now are shown',
        checks: [
          checks.textEquals(inCard('.rec-title'), title),
          checks.attrEquals(inCard('.rec-link-company', 'recCompany'), 'title', `Now at ${nowAt}`),
        ],
      });
    }
    if (hasLetter) {
      steps.push({
        title: `Then ${first}'s letter of recommendation icon populates and is downloadable`,
        checks: [checks.attrEquals(byTestId(`rec-letter-${slug}`), 'download', '')],
      });
    }
    steps.push({
      title: 'Then the recommendation decrypts and reads in full',
      checks: [
        checks.textContains(inCard('blockquote p'), excerpt),
        checks.attrEquals(card, 'data-status', 'pass'),
      ],
    });

    const testName = `Test_Case_${4100 + recs}_Recommendations_${pascal(name)}_LetterRenders`;
    const code = RENDER[lang]({
      testName,
      slug,
      cardAccessor: 'recCard',
      cardTestId: `rec-card-${slug}`,
      steps,
      doc: `${name}'s letter renders, linked to a real profile, and reads in full.`,
    });
    return `${open}${body}\n${INDENT}${detailsBlock({ lang, testid: `rec-test-${slug}`, testName, steps, code })}${bqOpen}`;
  },
);

// accomplishments: the tested cards in Field Notes, each in the tool the work was done in
let entries = 0;
html = html.replace(
  /(<article class="card card-tested" data-testid="accomplishment-card-([^"]+)">)([\s\S]*?)(\n\s*<div class="card-body">)/g,
  (m, open, slug, body, bodyOpen, offset) => {
    const heading = decodeEntities(body.match(/<h3>([\s\S]*?)<\/h3>/)[1]);
    const link = body.match(
      /<p class="card-meta">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/,
    );
    const href = link[1];
    const company = decodeEntities(link[2]);
    const photo = body.match(/<img class="card-photo"[^>]*alt="([^"]*)"/);
    const rest = html.slice(offset + m.length, html.indexOf('</article>', offset));
    const entryText = decodeEntities(rest.match(/<p>([\s\S]*?)<\/p>/)[1]);
    const excerpt = excerptOf(entryText);
    entries++;
    const lang = ACCOMPLISHMENT_LANGUAGE[slug] ?? CYCLE[(entries - 1) % CYCLE.length];

    const steps = [
      {
        title: `Then the entry is headed "${heading}"`,
        checks: [checks.textEquals(inCard('h3'), heading)],
      },
      {
        title: `Then it names ${company}, linking out to their site in a new tab`,
        checks: [
          checks.attrEquals(inCard('.card-meta a'), 'href', href),
          checks.attrEquals(inCard('.card-meta a'), 'target', '_blank'),
          checks.attrMatches(inCard('.card-meta a'), 'rel', 'noopener'),
        ],
      },
    ];
    if (photo) {
      steps.push({
        title: 'Then the photograph has loaded and is described for a screen reader',
        checks: [
          checks.imagePainted(inCard('.card-photo')),
          checks.attrEquals(inCard('.card-photo'), 'alt', photo[1]),
        ],
      });
    }
    steps.push({
      title: 'Then the entry decrypts and reads in full',
      checks: [
        checks.textContains(inCard('.card-body p'), excerpt),
        checks.attrEquals(card, 'data-status', 'pass'),
      ],
    });

    const testName = `Test_Case_${3100 + entries}_Accomplishments_${pascal(heading)}_EntryRenders`;
    const code = RENDER[lang]({
      testName,
      slug,
      cardAccessor: 'accomplishmentCard',
      cardTestId: `accomplishment-card-${slug}`,
      steps,
      doc: `The "${heading}" entry renders with its company link and reads in full.`,
    });
    return `${open}${body}\n${INDENT}${detailsBlock({ lang, testid: `accomplishment-test-${slug}`, testName, steps, code })}${bodyOpen}`;
  },
);

writeFileSync(PAGE, crlf ? html.replace(/\n/g, '\r\n') : html);
console.log(
  `${PAGE}: stripped ${stripped}, wrote ${recs} recommendation tests and ${entries} accomplishment tests`,
);
