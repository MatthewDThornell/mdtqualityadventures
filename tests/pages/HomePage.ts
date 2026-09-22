import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type ContactLinkKind = 'email' | 'phone' | 'linkedin' | 'github' | 'qap';

export class HomePage extends BasePage {
  static readonly url = '/';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(HomePage.url);
  }

  // --- Hero ---
  // the brand mark centered over the name (decorative; the header names the brand)
  get heroBrand(): Locator {
    return this.page.getByTestId('hero-brand');
  }

  get heroHeading(): Locator {
    return this.page.getByTestId('hero-heading');
  }

  // The eyebrow/tagline are typed/erased character-by-character by
  // src/typewriter.js — assert against the *-static (visually-hidden,
  // screen-reader) duplicates instead of the animated element, which is
  // aria-hidden and passes through empty/partial text mid-cycle.
  get heroEyebrowStatic(): Locator {
    return this.page.getByTestId('hero-eyebrow-static');
  }

  get heroTaglineStatic(): Locator {
    return this.page.getByTestId('hero-tagline-static');
  }

  get heroScrollCue(): Locator {
    return this.page.getByTestId('hero-scroll-cue');
  }

  get careerTrail(): Locator {
    return this.page.getByTestId('career-trail');
  }

  /** A career-trail entry as it's added by src/main.js's addToCareerTrail(). */
  careerTrailItem(companySlug: string): Locator {
    return this.page.getByTestId(`career-trail-item-${companySlug}`);
  }

  /** The company logos bracketing a trail entry's role (two per entry). */
  careerTrailLogos(companySlug: string): Locator {
    return this.careerTrailItem(companySlug).locator('img.career-trail-logo');
  }

  // --- Professional Experience ---
  get credentialResumeBtn(): Locator {
    return this.page.getByTestId('credential-btn-resume');
  }

  get credentialLetterBtn(): Locator {
    return this.page.getByTestId('credential-btn-letter');
  }

  get credentialLinkedInBtn(): Locator {
    return this.page.getByTestId('credential-btn-linkedin');
  }

  get credentialGitHubBtn(): Locator {
    return this.page.getByTestId('credential-btn-github');
  }

  timelineItem(companySlug: string): Locator {
    return this.page.getByTestId(`timeline-item-${companySlug}`);
  }

  /** The "by the numbers" strip under the chapter intro. */
  get figures(): Locator {
    return this.page.getByTestId('figures');
  }

  figureNumber(slug: 'years' | 'coverage' | 'mentored' | 'letters'): Locator {
    return this.page.getByTestId(`figure-${slug}`).locator('.figure-number');
  }

  /** The recommendation letters in the Recommendations chapter page only
   * (the mentees' "In Their Own Words" grid reuses the same card), not
   * counting the one card that fails on purpose — Quaid never wrote one. */
  get recommendationLetters(): Locator {
    return this.page.locator('#letters .rec-card:not([data-outcome])');
  }

  /** An incident card's investigation — the log and the generated test
   * under it. Quaid (fails) and the Anonymous User (blocked) each have one. */
  incidentReport(slug: 'quaid' | 'anonymous'): Locator {
    return this.page.getByTestId(`${slug}-report`);
  }

  incidentGeneratedTest(slug: 'quaid' | 'anonymous'): Locator {
    return this.page.getByTestId(`${slug}-generated-test`);
  }

  get quaidReport(): Locator {
    return this.incidentReport('quaid');
  }

  get quaidGeneratedTest(): Locator {
    return this.incidentGeneratedTest('quaid');
  }

  // --- About Me ---
  /** Already has a stable id (`#aboutQuote`) predating the data-testid rollout — no testid needed. */
  get aboutQuote(): Locator {
    return this.page.locator('#aboutQuote');
  }

  get habitsList(): Locator {
    return this.page.locator('.habits-list li');
  }

  /** The kit's tool marks — one image per tool, named by its alt. */
  get kitLogos(): Locator {
    return this.page.locator('.kit .kit-logo');
  }

  // --- Accomplishments ---
  accomplishmentCard(slug: string): Locator {
    return this.page.getByTestId(`accomplishment-card-${slug}`);
  }

  // the card's own test case (see scripts/generate-card-tests.mjs)
  accomplishmentTest(slug: string): Locator {
    return this.page.getByTestId(`accomplishment-test-${slug}`);
  }

  // --- Recommendations (also covers the mentees "In Their Own Words" grid,
  // which reuses the same rec-card-<person-slug> pattern) ---
  recCard(personSlug: string): Locator {
    return this.page.getByTestId(`rec-card-${personSlug}`);
  }

  /** The company chip at the foot of a card: where we worked together (a
   * letter) or where they are now (a mentee). */
  recCompany(personSlug: string): Locator {
    return this.recCard(personSlug).locator('.rec-link-company');
  }

  recLinkedIn(personSlug: string): Locator {
    return this.recCard(personSlug).locator('.rec-link-linkedin');
  }

  /** The card's own test case — the <details> above its quote that runs
   * (types out, passes, folds) before the quote is allowed to decrypt. */
  recTest(personSlug: string): Locator {
    return this.page.getByTestId(`rec-test-${personSlug}`);
  }

  // --- Mentors ---
  mentorCard(personSlug: string): Locator {
    return this.page.getByTestId(`mentor-card-${personSlug}`);
  }

  // --- Mentees ---
  menteeCard(personSlug: string): Locator {
    return this.page.getByTestId(`mentee-card-${personSlug}`);
  }

  /** The horizontal "Where Are They Now?" story rail below the mentee grid. */
  get menteeSpotlight(): Locator {
    return this.page.getByTestId('mentee-spotlight');
  }

  spotlightCard(personSlug: string): Locator {
    return this.page.getByTestId(`spotlight-card-${personSlug}`);
  }

  get spotlightTrack(): Locator {
    return this.menteeSpotlight.locator('[data-spotlight-track]');
  }

  /**
   * How far a slide's left edge sits from the rail's — 0 when that slide is the
   * one snapped into place. Asserting this rather than toBeInViewport(), since
   * these cards are tall enough to fall below the fold while still being the
   * slide the rail is showing.
   */
  async spotlightSlideOffset(personSlug: string): Promise<number> {
    const slide = await this.spotlightCard(personSlug).boundingBox();
    const track = await this.spotlightTrack.boundingBox();
    if (!slide || !track) return Number.NaN;
    return Math.abs(slide.x - track.x);
  }

  get spotlightPrevBtn(): Locator {
    return this.page.getByTestId('spotlight-prev');
  }

  get spotlightNextBtn(): Locator {
    return this.page.getByTestId('spotlight-next');
  }

  get spotlightPager(): Locator {
    return this.page.getByTestId('spotlight-pager');
  }

  // --- Adventures ---
  adventureCard(slug: string): Locator {
    return this.page.getByTestId(`adventure-card-${slug}`);
  }

  // --- Contact ---
  contactLink(kind: ContactLinkKind): Locator {
    return this.page.getByTestId(`contact-link-${kind}`);
  }

  get contactResumeBtn(): Locator {
    return this.page.getByTestId('contact-resume-btn');
  }
}
