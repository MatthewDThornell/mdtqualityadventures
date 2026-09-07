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

  // --- Accomplishments ---
  accomplishmentCard(slug: string): Locator {
    return this.page.getByTestId(`accomplishment-card-${slug}`);
  }

  // --- Recommendations (also covers the mentees "In Their Own Words" grid,
  // which reuses the same rec-card-<person-slug> pattern) ---
  recCard(personSlug: string): Locator {
    return this.page.getByTestId(`rec-card-${personSlug}`);
  }

  // --- Mentors ---
  mentorCard(personSlug: string): Locator {
    return this.page.getByTestId(`mentor-card-${personSlug}`);
  }

  // --- Mentees ---
  menteeCard(personSlug: string): Locator {
    return this.page.getByTestId(`mentee-card-${personSlug}`);
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
