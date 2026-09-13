// Page Object for https://www.optum.com/en/
// Selectors below are text/role-based placeholders built from the live page's
// visible content. Swap them for data-testid/data-cy selectors once the
// Cypress MCP selector scan (see README.md) confirms the real DOM attributes.

class OptumHomePage {
  elements = {
    logo: () => cy.get('a[href="/"]').first(),
    searchToggle: () => cy.get('[aria-label="Search"]'),
    searchInput: () => cy.get('input[type="search"]'),

    // Sign-in audience menu
    signInPatients: () => cy.contains('a, button', 'Patients, members & account holders'),
    signInProviders: () => cy.contains('a, button', 'Providers & organizations'),
    signInEmployers: () => cy.contains('a, button', 'Employers'),
    signInBrokers: () => cy.contains('a, button', 'Brokers & consultants'),

    // Primary nav
    navHealthCare: () => cy.contains('nav a, nav button', 'Health care'),
    navFinancial: () => cy.contains('nav a, nav button', 'Financial'),
    navPharmacy: () => cy.contains('nav a, nav button', 'Pharmacy'),

    // Hero banner
    heroHeading: () => cy.contains('h1', 'Health care you can count on'),
    ctaFindCare: () => cy.contains('a, button', 'Find care near you'),
    ctaPayBill: () => cy.contains('a, button', 'Pay a medical bill'),
    ctaManageHsaFsa: () => cy.contains('a, button', 'Manage an HSA or FSA'),
    ctaFillPrescription: () => cy.contains('a, button', 'Fill a prescription'),

    // Footer
    footerAboutUs: () => cy.contains('footer a', 'About us'),
    footerCareers: () => cy.contains('footer a', 'Careers'),
    footerPrivacyPolicy: () => cy.contains('footer a', 'Privacy policy'),
    footerTermsOfUse: () => cy.contains('footer a', 'Terms of use'),
  };

  visit() {
    cy.visit('/');
    return this;
  }

  openSearch(term) {
    this.elements.searchToggle().click();
    this.elements.searchInput().type(term);
    return this;
  }

  goToNav(section) {
    const map = {
      healthCare: this.elements.navHealthCare,
      financial: this.elements.navFinancial,
      pharmacy: this.elements.navPharmacy,
    };
    map[section]().click();
    return this;
  }

  clickHeroCta(cta) {
    const map = {
      findCare: this.elements.ctaFindCare,
      payBill: this.elements.ctaPayBill,
      manageHsaFsa: this.elements.ctaManageHsaFsa,
      fillPrescription: this.elements.ctaFillPrescription,
    };
    map[cta]().click();
    return this;
  }
}

export default new OptumHomePage();
