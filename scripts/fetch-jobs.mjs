// Fetches QA-relevant job listings from free public job boards at build time
// and writes them to public/data/jobs.json, which src/jobs.js fetches
// client-side (same-origin, so no CORS/API-key concerns reach the browser).
// Run automatically as part of `npm run build`. Safe to fail: a network
// hiccup here never breaks the build — the previously-committed jobs.json
// is just left in place instead of being overwritten with nothing.
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/data/jobs.json');
const REQUEST_TIMEOUT_MS = 15000;
const MAX_JOBS = 100;
// Arbeitnow's API is paginated and returns 100-250 listings per page, with
// real results well past page 50 — fetching only page 1 (which this script
// did originally) scanned a rounding error's worth of its actual board.
// Deep pages skew older, and the 14-day cutoff below discards those anyway,
// so there's no point walking the whole thing.
const ARBEITNOW_PAGES = 15;
// A posting that's been up for months is likely already filled — nobody
// mentoring off this list should waste an application on one. Every source
// here does supply a posted/updated date (see each fetch*() below), so a
// missing or unparseable one is treated as stale too rather than assumed
// fresh.
const MAX_JOB_AGE_DAYS = 14;

// Greenhouse, Lever, and Ashby all run a free, no-key "job board" API per
// company, meant for public embedding — unlike Remote OK/Arbeitnow, the
// listing URL they return is the company's own career page (confirmed by
// hand: Stripe's resolves to stripe.com, Pinterest's to
// pinterestcareers.com), so these are genuinely direct applications, not
// routed through a third-party board. There's no "search everything"
// endpoint for any of the three, so these are a curated seed of real
// companies verified to have working boards — add more here as you find
// them (fetch https://boards-api.greenhouse.io/v1/boards/<token>/jobs,
// https://api.lever.co/v0/postings/<token>?mode=json, or
// https://api.ashbyhq.com/posting-api/job-board/<token> to check a token).
// SmartRecruiters, Recruitee, and Teamtailor also run similar free per-
// company APIs, but guessing at their tokens had too low a hit rate to be
// worth seeding blindly — worth adding if you know specific companies that
// use them.
const GREENHOUSE_COMPANIES = [
  { name: 'GitLab', token: 'gitlab' },
  { name: 'Robinhood', token: 'robinhood' },
  { name: 'Discord', token: 'discord' },
  { name: 'Reddit', token: 'reddit' },
  { name: 'Affirm', token: 'affirm' },
  { name: 'Coinbase', token: 'coinbase' },
  { name: 'Squarespace', token: 'squarespace' },
  { name: 'Asana', token: 'asana' },
  { name: 'Cloudflare', token: 'cloudflare' },
  { name: 'Webflow', token: 'webflow' },
  { name: 'Airtable', token: 'airtable' },
  { name: 'Figma', token: 'figma' },
  { name: 'Brex', token: 'brex' },
  { name: 'Duolingo', token: 'duolingo' },
  { name: 'Pinterest', token: 'pinterest' },
  { name: 'Twitch', token: 'twitch' },
  { name: 'Stripe', token: 'stripe' },
  { name: 'Doximity', token: 'doximity' },
  { name: 'Samsara', token: 'samsara' },
  { name: 'Okta', token: 'okta' },
  { name: 'Datadog', token: 'datadog' },
  { name: 'Elastic', token: 'elastic' },
  { name: 'MongoDB', token: 'mongodb' },
  { name: 'Databricks', token: 'databricks' },
  { name: 'Vercel', token: 'vercel' },
  { name: 'Calendly', token: 'calendly' },
  { name: 'Mixpanel', token: 'mixpanel' },
  { name: 'Amplitude', token: 'amplitude' },
  { name: 'Airbnb', token: 'airbnb' },
  { name: 'Lyft', token: 'lyft' },
  { name: 'Instacart', token: 'instacart' },
  { name: 'Twilio', token: 'twilio' },
  { name: 'Dropbox', token: 'dropbox' },
  { name: 'Roblox', token: 'roblox' },
  { name: 'Toast', token: 'toast' },
  { name: 'Block', token: 'block' },
  { name: 'Chime', token: 'chime' },
  { name: 'SoFi', token: 'sofi' },
  { name: 'Carta', token: 'carta' },
  { name: 'Gusto', token: 'gusto' },
  { name: 'Flexport', token: 'flexport' },
  { name: 'Faire', token: 'faire' },
  { name: 'Nextdoor', token: 'nextdoor' },
  { name: 'Klaviyo', token: 'klaviyo' },
  { name: 'Braze', token: 'braze' },
  { name: 'Attentive', token: 'attentive' },
  { name: 'Coursera', token: 'coursera' },
  { name: 'Udemy', token: 'udemy' },
  { name: 'Scale AI', token: 'scaleai' },
  { name: 'Anthropic', token: 'anthropic' },
  { name: 'Verkada', token: 'verkada' },
  { name: 'Cockroach Labs', token: 'cockroachlabs' },
  { name: 'PlanetScale', token: 'planetscale' },
  { name: 'LaunchDarkly', token: 'launchdarkly' },
  { name: 'Netlify', token: 'netlify' },
  { name: 'CircleCI', token: 'circleci' },
  { name: 'Postman', token: 'postman' },
  // QA/testing-focused employers — the highest-yield corner of this list,
  // since testing is the product rather than a supporting function.
  { name: 'Thoughtworks', token: 'thoughtworks' },
  { name: 'Testlio', token: 'testlio' },
  { name: 'Sauce Labs', token: 'saucelabs' },
  { name: 'SmartBear', token: 'smartbear' },
  { name: 'mabl', token: 'mabl' },
];

const LEVER_COMPANIES = [
  { name: 'Palantir', token: 'palantir' },
  { name: 'Kraken', token: 'kraken' },
  { name: 'Spotify', token: 'spotify' },
  { name: 'Toptal', token: 'toptal' },
  { name: 'Clari', token: 'clari' },
  { name: 'Wealthsimple', token: 'wealthsimple' },
  { name: 'Shield AI', token: 'shieldai' },
  { name: 'Gopuff', token: 'gopuff' },
  { name: 'Wealthfront', token: 'wealthfront' },
  { name: 'Houzz', token: 'houzz' },
];

const ASHBY_COMPANIES = [
  { name: 'Ramp', token: 'ramp' },
  { name: 'Linear', token: 'linear' },
  { name: 'Substack', token: 'substack' },
  { name: 'Snyk', token: 'snyk' },
  { name: 'Replit', token: 'replit' },
  { name: 'Deel', token: 'deel' },
  { name: 'Notion', token: 'notion' },
  { name: 'Mercury', token: 'mercury' },
  { name: 'Benchling', token: 'benchling' },
  { name: 'Hex', token: 'hex' },
  { name: 'OpenAI', token: 'openai' },
  { name: 'Perplexity', token: 'perplexity' },
  { name: 'Runway', token: 'runway' },
  { name: 'Suno', token: 'suno' },
  { name: 'Cursor', token: 'cursor' },
  { name: 'Watershed', token: 'watershed' },
  { name: 'Persona', token: 'persona' },
  { name: 'Modal', token: 'modal' },
  { name: 'Fireworks AI', token: 'fireworks' },
  { name: 'Attio', token: 'attio' },
  { name: 'Cerebras', token: 'cerebras' },
  { name: 'Cohere', token: 'cohere' },
  { name: 'ElevenLabs', token: 'elevenlabs' },
  { name: 'Synthesia', token: 'synthesia' },
  { name: 'Character.AI', token: 'character' },
  { name: 'LangChain', token: 'langchain' },
  { name: 'Baseten', token: 'baseten' },
  { name: 'Anyscale', token: 'anyscale' },
  { name: 'Crusoe', token: 'crusoe' },
  { name: 'Sierra', token: 'sierra' },
  { name: 'Harvey', token: 'harvey' },
  { name: 'Decagon', token: 'decagon' },
  { name: 'Abridge', token: 'abridge' },
  { name: 'Vanta', token: 'vanta' },
  { name: 'Sardine', token: 'sardine' },
  { name: 'Zip', token: 'zip' },
  { name: 'Clerk', token: 'clerk' },
  { name: 'Resend', token: 'resend' },
  { name: 'Railway', token: 'railway' },
  { name: 'Neon', token: 'neon' },
  { name: 'Browserbase', token: 'browserbase' },
  { name: 'Pylon', token: 'pylon' },
  { name: 'Greptile', token: 'greptile' },
  { name: 'Gamma', token: 'gamma' },
  { name: 'Campus', token: 'campus' },
];

// Workable runs the same kind of free, no-key public widget API
// (apply.workable.com/api/v1/widget/accounts/<token>). Its response carries
// no job description, so AMBIGUOUS_TITLE_KEYWORDS can never qualify here —
// only unambiguous QA titles will ever match from this source.
const WORKABLE_COMPANIES = [
  { name: 'Blueground', token: 'blueground' },
  { name: 'Skroutz', token: 'skroutz' },
  { name: 'Orfium', token: 'orfium' },
  { name: 'Hellas Direct', token: 'hellasdirect' },
  { name: 'Persado', token: 'persado' },
];

// Matched against the job *title* only, not tags — a "quality assurance"
// tag shows up on plenty of unrelated ops/dev roles on these boards, but
// nobody titles a listing "QA Engineer" unless it actually is one.
const TITLE_KEYWORDS = [
  'qa engineer',
  'qa analyst',
  'qa tester',
  'quality assurance',
  'quality engineer',
  'quality analyst',
  'software quality engineer',
  'automation quality engineer',
  'sdet',
  'test engineer',
  'test automation',
  'software tester',
  'manual tester',
  // Seniority/specialization variants that a strict "<discipline> engineer"
  // list misses — all seen on real listings these sources actually returned
  // (e.g. Thoughtworks posts "Lead Quality Analyst", Testlio "Software
  // Tester", plenty of shops title the role "QA Lead" or "Test Analyst").
  'qa lead',
  'test lead',
  'qa manager',
  'test manager',
  'qa specialist',
  'test specialist',
  'quality specialist',
  'test analyst',
  'qa automation',
  'automation tester',
  'test architect',
  'quality architect',
  'qa consultant',
];

// "Automation Engineer"/"Automation Architect" alone are too ambiguous to
// title-match on their own — those exact titles are just as common in
// industrial/PLC and business-process automation as in QA. Only count them
// when the listing's own description actually mentions QA/testing context.
const AMBIGUOUS_TITLE_KEYWORDS = ['automation engineer', 'automation architect'];
const SOFTWARE_CONTEXT_KEYWORDS = [
  'qa',
  'quality assurance',
  'test automation',
  'test case',
  'test plan',
  'regression test',
  'manual testing',
  'software testing',
  'sdet',
  'selenium',
  'playwright',
  'cypress',
  'test coverage',
];

// Listings are employer/user-submitted (Remote OK, Arbeitnow) or at minimum
// third-party-hosted — never trust a URL enough to render as an href without
// checking its scheme first.
function isSafeHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

// Lever exposes a genuine workplaceType field ("remote"/"hybrid"/"on-site")
// on newer postings — used when present. Everything else (Greenhouse has no
// such field; Remote OK/Arbeitnow only have a remote boolean) falls back to
// a text search for "hybrid" across title/description/location, then the
// remote flag.
function classifyWorkType({ remote, explicitType, title = '', description = '', location = '' }) {
  if (explicitType) {
    const t = explicitType.toLowerCase();
    if (t.includes('hybrid')) return 'Hybrid';
    if (t.includes('remote')) return 'Remote';
    if (t.includes('on-site') || t.includes('onsite') || t.includes('office')) return 'On-site';
  }
  const text = `${title} ${description} ${location}`.toLowerCase();
  if (/\bhybrid\b/.test(text)) return 'Hybrid';
  if (remote || /\bremote\b/.test(text)) return 'Remote';
  return 'On-site';
}

// None of the four sources give a clean, structured country field — it's all
// free-text location strings ("Taipei,Taiwan", "Cologne (GER)", bare
// "Remote", "New York, NY"). This is a best-effort heuristic, same spirit as
// classifyWorkType: explicit country/state signals first, then a short list
// of major-city fallbacks for the cities that actually show up in this
// data. Ambiguous city names (e.g. "Birmingham" is UK or Alabama) are
// resolved toward whichever reading is more common on these particular
// boards, not guaranteed correct.
// Comma-separated ("Austin, TX") is the common format, but Greenhouse
// locations often use a dash instead ("Remote - CA") — accept either.
const US_STATE_ABBREVIATIONS =
  /[,-]\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/;

// Plenty of listings spell the state out instead ("Woodinville, Washington"),
// which the abbreviation pattern above silently misses — and since the page's
// region filter defaults to United States, a miss there hides a genuinely
// US-based job from the default view entirely.
const US_STATE_NAMES =
  /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i;

const COUNTRY_PATTERNS = [
  {
    country: 'United States',
    patterns: [
      /\bUSA\b/i,
      /United States/i,
      /\bU\.S\.A?\.?\b/,
      /\bUS\b/,
      US_STATE_ABBREVIATIONS,
      US_STATE_NAMES,
      /\b(San Francisco|New York|Seattle|Austin|Boston|Chicago|Denver|Atlanta|Los Angeles|Washington,? ?D\.?C\.?|Miami|Dallas|Houston|Philadelphia)\b/i,
    ],
  },
  { country: 'Canada', patterns: [/Canada/i, /\b(Toronto|Vancouver|Montreal|Ottawa|Calgary)\b/i] },
  {
    country: 'United Kingdom',
    patterns: [
      /United Kingdom/i,
      /\bUK\b/,
      /\bEngland\b/i,
      /\bScotland\b/i,
      /\b(London|Manchester|Birmingham|Leeds|Edinburgh|Bristol)\b/i,
    ],
  },
  {
    country: 'Germany',
    patterns: [
      /Germany/i,
      /\(GER\)/,
      /\bGmbH\b/,
      // Arbeitnow is a German-first board, so deep pagination surfaces a lot
      // of mid-size German cities that a "major cities only" list misses.
      /\b(Berlin|Munich|M[üu]nchen|Cologne|K[öo]ln|Hamburg|Frankfurt|D[üu]sseldorf|Stuttgart|Leipzig|Dortmund|Essen|Bremen|Dresden|Hannover|N[üu]rnberg|Nuremberg|Bonn|M[üu]nster|Augsburg|Karlsruhe|Mannheim|Wiesbaden|Bielefeld|Aachen)\b/i,
    ],
  },
  { country: 'Taiwan', patterns: [/Taiwan/i] },
  {
    country: 'India',
    patterns: [/India/i, /\b(Bangalore|Bengaluru|Mumbai|Hyderabad|Pune|Delhi)\b/i],
  },
  { country: 'Australia', patterns: [/Australia/i, /\b(Sydney|Melbourne|Brisbane)\b/i] },
  { country: 'Ireland', patterns: [/Ireland/i, /\bDublin\b/i] },
  { country: 'Netherlands', patterns: [/Netherlands/i, /\bAmsterdam\b/i] },
  { country: 'France', patterns: [/France/i, /\bParis\b/i] },
  { country: 'Spain', patterns: [/Spain/i, /\b(Madrid|Barcelona)\b/i] },
  { country: 'Singapore', patterns: [/Singapore/i] },
  { country: 'Japan', patterns: [/Japan/i, /\bTokyo\b/i] },
  { country: 'Brazil', patterns: [/Brazil/i, /\bS[aã]o Paulo\b/i] },
  { country: 'Mexico', patterns: [/Mexico/i] },
];

function classifyCountry(location) {
  const loc = (location || '').trim();
  if (!loc || /^remote$/i.test(loc)) return 'Remote / Unspecified';
  for (const { country, patterns } of COUNTRY_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(loc))) return country;
  }
  return 'Other';
}

// Widening past software-only companies (OpenAI, Samsara, etc. also build
// physical hardware/datacenters) surfaced a new false-positive class: "Test
// Engineer"/"Quality Engineer" titles that are actually about manufacturing
// or datacenter hardware, not software. Checked against the title itself —
// a hardware-QA role names its domain right in the title on every real
// example seen so far.
const HARDWARE_EXCLUSION_KEYWORDS = [
  'manufacturing',
  'hardware',
  'datacenter',
  'data center',
  'interconnect',
  'rack infrastructure',
  'site operations',
  'mechanical',
  'electrical',
  'firmware',
  'pcb',
  'supply chain',
  'consumer devices',
  // Aerospace/defense boards title physical airframe testing the same way
  // software QA titles read — "Senior Flight Test Engineer" is a pilot-
  // adjacent role, not an SDET one.
  'flight test',
  'aerospace',
  'avionics',
  'supplier quality',
];

function isFreshEnough(postedAt) {
  if (!postedAt) return false;
  const posted = new Date(postedAt);
  if (Number.isNaN(posted.getTime())) return false;
  const ageMs = Date.now() - posted.getTime();
  return ageMs <= MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000;
}

function isQaRelevant(title, description = '') {
  const t = title.toLowerCase();
  if (HARDWARE_EXCLUSION_KEYWORDS.some((keyword) => t.includes(keyword))) return false;
  if (TITLE_KEYWORDS.some((keyword) => t.includes(keyword))) return true;

  const isAmbiguousTitle = AMBIGUOUS_TITLE_KEYWORDS.some((keyword) => t.includes(keyword));
  if (!isAmbiguousTitle) return false;

  const d = description.toLowerCase();
  return SOFTWARE_CONTEXT_KEYWORDS.some((keyword) => d.includes(keyword));
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MDTQualityAdventures/1.0)' },
    });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Remote OK API Terms of Service require linking back to Remote OK and
// crediting it as the source wherever listings are shown — see sourceUrl
// and its use in src/jobs.js.
async function fetchRemoteOk() {
  const data = await fetchJson('https://remoteok.com/api');
  return data
    .slice(1) // first entry is a legal/metadata notice, not a job
    .filter((job) => job.position && isQaRelevant(job.position, job.description))
    .map((job) => ({
      id: `remoteok-${job.id}`,
      title: job.position,
      company: job.company,
      url: job.url || job.apply_url,
      source: 'Remote OK',
      sourceUrl: 'https://remoteok.com/remote-qa-jobs',
      direct: false,
      workType: classifyWorkType({
        remote: true,
        title: job.position,
        description: job.description,
      }),
      location: job.location || 'Remote',
      country: classifyCountry(job.location),
      postedAt: job.date || null,
    }))
    .filter((job) => isSafeHttpUrl(job.url));
}

// Arbeitnow's employer-name parsing occasionally fails for certain
// externally-hosted boards, leaving company_name as "<something> - <ATS
// platform>" instead of an actual company — confirmed by hand against a
// live pull (one instance even carried a completely different job's title).
// A "company" that's really just an ATS platform name isn't safe to show.
const ARBEITNOW_BROKEN_COMPANY_SUFFIX =
  / - (Greenhouse|Lever|Workday|iCIMS|SmartRecruiters|Taleo|BambooHR|JazzHR|Recruitee|Workable|Breezy|Personio|Ashby)$/i;

// The same parsing failure also shows up as an un-deslugified company name
// ("sonyinteractiveentertainmentglobal"). A real company name that long
// always has a space in it, so this catches the slugs without touching
// legitimate single-word names like "Spotify" or "Datadog".
function isUnspacedSlugName(companyName = '') {
  return companyName.length > 20 && !/\s/.test(companyName);
}

async function fetchArbeitnow() {
  const pages = await Promise.allSettled(
    Array.from({ length: ARBEITNOW_PAGES }, (_, i) =>
      fetchJson(`https://www.arbeitnow.com/api/job-board-api?page=${i + 1}`),
    ),
  );

  const seen = new Set();
  const data = pages
    .filter((page) => page.status === 'fulfilled')
    .flatMap((page) => page.value.data || [])
    .filter((job) => {
      if (!job.slug || seen.has(job.slug)) return false;
      seen.add(job.slug);
      return true;
    });

  return data
    .filter((job) => job.title && isQaRelevant(job.title, job.description))
    .filter(
      (job) =>
        !ARBEITNOW_BROKEN_COMPANY_SUFFIX.test(job.company_name || '') &&
        !isUnspacedSlugName(job.company_name || ''),
    )
    .map((job) => ({
      id: `arbeitnow-${job.slug}`,
      title: job.title,
      company: job.company_name,
      url: job.url,
      source: 'Arbeitnow',
      sourceUrl: 'https://www.arbeitnow.com/?search=QA',
      direct: false,
      workType: classifyWorkType({
        remote: Boolean(job.remote),
        title: job.title,
        description: job.description,
      }),
      location: job.location || (job.remote ? 'Remote' : ''),
      country: classifyCountry(job.location),
      postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
    }))
    .filter((job) => isSafeHttpUrl(job.url));
}

async function fetchGreenhouseBoard({ name, token }) {
  const data = await fetchJson(
    `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
  );
  return (data.jobs || [])
    .filter((job) => job.title && isQaRelevant(job.title, job.content))
    .map((job) => ({
      id: `greenhouse-${token}-${job.id}`,
      title: job.title,
      company: name,
      url: job.absolute_url,
      source: name,
      sourceUrl: null,
      direct: true,
      workType: classifyWorkType({
        remote: false,
        title: job.title,
        description: job.content,
        location: job.location?.name,
      }),
      location: job.location?.name || '',
      country: classifyCountry(job.location?.name),
      postedAt: job.updated_at || null,
    }))
    .filter((job) => isSafeHttpUrl(job.url));
}

async function fetchLeverBoard({ name, token }) {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${token}?mode=json`);
  return (Array.isArray(data) ? data : [])
    .filter((job) => job.text && isQaRelevant(job.text, job.descriptionPlain))
    .map((job) => ({
      id: `lever-${token}-${job.id}`,
      title: job.text,
      company: name,
      url: job.hostedUrl,
      source: name,
      sourceUrl: null,
      direct: true,
      workType: classifyWorkType({
        remote: job.workplaceType === 'remote',
        explicitType: job.workplaceType,
        title: job.text,
        description: job.descriptionPlain,
        location: job.categories?.location,
      }),
      location: job.categories?.location || '',
      country: classifyCountry(job.categories?.location),
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    }))
    .filter((job) => isSafeHttpUrl(job.url));
}

async function fetchAshbyBoard({ name, token }) {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${token}`);
  return (data.jobs || [])
    .filter((job) => job.title && isQaRelevant(job.title, job.descriptionPlain))
    .map((job) => ({
      id: `ashby-${token}-${job.id}`,
      title: job.title,
      company: name,
      url: job.jobUrl || job.applyUrl,
      source: name,
      sourceUrl: null,
      direct: true,
      workType: classifyWorkType({
        remote: job.isRemote === true,
        explicitType: job.workplaceType,
        title: job.title,
        description: job.descriptionPlain,
        location: job.location,
      }),
      location: job.location || '',
      country: classifyCountry(job.location),
      postedAt: job.publishedAt || null,
    }))
    .filter((job) => isSafeHttpUrl(job.url));
}

async function fetchWorkableBoard({ name, token }) {
  const data = await fetchJson(`https://apply.workable.com/api/v1/widget/accounts/${token}`);
  return (data.jobs || [])
    .filter((job) => job.title && isQaRelevant(job.title))
    .map((job) => {
      const location = [job.city, job.state, job.country].filter(Boolean).join(', ');
      return {
        id: `workable-${token}-${job.shortcode}`,
        title: job.title,
        company: name,
        url: job.url,
        source: name,
        sourceUrl: null,
        direct: true,
        workType: classifyWorkType({
          remote: Boolean(job.telecommuting),
          title: job.title,
          location,
        }),
        location,
        country: classifyCountry(location),
        postedAt: job.published_on ? new Date(job.published_on).toISOString() : null,
      };
    })
    .filter((job) => isSafeHttpUrl(job.url));
}

// Remotive's and Jobicy's own search/tag/category query params turned out
// not to actually filter server-side (tested by hand — the same generic
// results come back regardless of the query) — so, like Remote OK, both are
// fetched broadly and filtered by isQaRelevant() here rather than trusted to
// pre-filter. Both require crediting them with a link back wherever their
// listings are shown — see sourceUrl and its use in src/jobs.js.
async function fetchRemotive() {
  const data = await fetchJson('https://remotive.com/api/remote-jobs');
  return (data.jobs || [])
    .filter((job) => job.title && isQaRelevant(job.title, job.description))
    .map((job) => ({
      id: `remotive-${job.id}`,
      title: job.title,
      company: job.company_name,
      url: job.url,
      source: 'Remotive',
      sourceUrl: 'https://remotive.com/remote-jobs/quality-assurance',
      direct: false,
      workType: classifyWorkType({
        remote: true,
        title: job.title,
        description: job.description,
        location: job.candidate_required_location,
      }),
      location: job.candidate_required_location || 'Remote',
      country: classifyCountry(job.candidate_required_location),
      postedAt: job.publication_date || null,
    }))
    .filter((job) => isSafeHttpUrl(job.url));
}

async function fetchJobicy() {
  // 200 is Jobicy's actual ceiling — count=500 still returns 200.
  const data = await fetchJson('https://jobicy.com/api/v2/remote-jobs?count=200');
  return (data.jobs || [])
    .filter((job) => job.jobTitle && isQaRelevant(job.jobTitle, job.jobDescription))
    .map((job) => ({
      id: `jobicy-${job.id}`,
      title: job.jobTitle,
      company: job.companyName,
      url: job.url,
      source: 'Jobicy',
      sourceUrl: 'https://jobicy.com/remote-quality-assurance-jobs',
      direct: false,
      workType: classifyWorkType({
        remote: true,
        title: job.jobTitle,
        description: job.jobDescription,
        location: job.jobGeo,
      }),
      location: job.jobGeo || 'Remote',
      country: classifyCountry(job.jobGeo),
      postedAt: job.pubDate || null,
    }))
    .filter((job) => isSafeHttpUrl(job.url));
}

async function main() {
  const sources = [
    { label: 'Remote OK', fetcher: fetchRemoteOk },
    { label: 'Arbeitnow', fetcher: fetchArbeitnow },
    { label: 'Remotive', fetcher: fetchRemotive },
    { label: 'Jobicy', fetcher: fetchJobicy },
    ...GREENHOUSE_COMPANIES.map((company) => ({
      label: `Greenhouse:${company.name}`,
      fetcher: () => fetchGreenhouseBoard(company),
    })),
    ...LEVER_COMPANIES.map((company) => ({
      label: `Lever:${company.name}`,
      fetcher: () => fetchLeverBoard(company),
    })),
    ...ASHBY_COMPANIES.map((company) => ({
      label: `Ashby:${company.name}`,
      fetcher: () => fetchAshbyBoard(company),
    })),
    ...WORKABLE_COMPANIES.map((company) => ({
      label: `Workable:${company.name}`,
      fetcher: () => fetchWorkableBoard(company),
    })),
  ];

  const results = await Promise.allSettled(sources.map((source) => source.fetcher()));
  const succeeded = results.filter((result) => result.status === 'fulfilled');

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn(
        `[fetch-jobs] Source "${sources[i].label}" failed:`,
        result.reason?.message || result.reason,
      );
    }
  });

  if (succeeded.length === 0) {
    console.warn('[fetch-jobs] Every source failed — keeping existing jobs.json untouched.');
    return;
  }

  const combined = succeeded.flatMap((result) => result.value);
  const fresh = combined.filter((job) => isFreshEnough(job.postedAt));
  const jobs = fresh
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0))
    .slice(0, MAX_JOBS);

  const payload = {
    fetchedAt: new Date().toISOString(),
    jobs,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n');
  console.log(
    `[fetch-jobs] Wrote ${jobs.length} QA-relevant job(s) to ${OUTPUT_PATH} (${succeeded.length}/${sources.length} sources succeeded, ` +
      `${combined.length - fresh.length} filtered out for being older than ${MAX_JOB_AGE_DAYS} days)`,
  );
}

main().catch((err) => {
  console.warn(
    '[fetch-jobs] Unexpected error — keeping existing jobs.json untouched:',
    err.message,
  );
});
