---

# Optum.com — Test Coverage Analysis

**Generated:** 2026-08-05
**Test Suite:** <img src="assets/playwright-logo.svg" alt="Playwright" width="18" style="vertical-align:middle" /> Playwright .NET 9 — OptumPlaywright
**Target:** `https://www.optum.com/en/` (public site)

---

## Executive Summary

| Metric | Value | Health |
|--------|-------|--------|
| **Total Features Inventoried** | 39 | — |
| **Features With Automation Coverage** | 12 | — |
| **Features With No Coverage** | 27 | — |
| **Overall Coverage** | **31 %** | 🔴 Early-stage |
| **Total Automated Tests** | 12 | — |
| **Tests Passing (latest run)** | 12 | 🟢 |
| **Test Pass Rate** | 100 % (on covered features) | 🟢 |

> This is a from-scratch suite built to demonstrate structure and conventions, not a mature
> product's regression suite — 31% reflects an honest starting point across four modules on a
> single day, not a stalled initiative. Coverage should climb quickly since each new module
> follows the same page-object + template pattern already proven out in `Tests/`.

> **What "coverage" means here:** a feature is counted as covered if at least one automated
> test validates its presence and basic interactability (visible, enabled, or routes correctly).
> Depth (every FAQ item, every CTA destination) is tracked separately per feature.

---

## Coverage by Module

### 🟡 1. Home  `71 %`

| Feature | Covered | Test IDs |
|---------|---------|----------|
| Hero heading renders | ✅ | TC1000 |
| Header nav (Customer service, Sign in) | ✅ | TC1001 |
| Hero CTAs (Find care, Pay bill, Manage HSA/FSA, Fill Rx) | ✅ | TC1002 |
| Footer legal/company links | ✅ | TC1003 |
| Page `<title>` | ✅ | TC1004 |
| "Health care" / "Financial" / "Pharmacy" mega-menu content | ❌ | — |
| Featured content sections (Health finances, Wellness articles) | ❌ | — |

**Module Coverage: 5 / 7 = 71 %**

---

### 🟡 2. Customer Service  `50 %`

| Feature | Covered | Test IDs |
|---------|---------|----------|
| Page heading | ✅ | TC2000 |
| "Common service questions" FAQ section | ✅ | TC2001 |
| "Contact us" fallback link | ✅ | TC2002 |
| Individual FAQ answer expand/collapse | ❌ | — |
| Pharmacy / financial support sub-links | ❌ | — |
| Business & sales support link (business.optum.com) | ❌ | — |

**Module Coverage: 3 / 6 = 50 %**

---

### 🟡 3. About Us  `40 %`

| Feature | Covered | Test IDs |
|---------|---------|----------|
| Page heading | ✅ | TC3000 |
| "Healthy Optumism" brand section | ✅ | TC3001 |
| "Bright minds, bold solutions" section | ❌ | — |
| "We're making healthcare easier" section | ❌ | — |
| Careers CTA on the About page | ❌ | — |

**Module Coverage: 2 / 5 = 40 %**

---

### 🔴 4. Cross-Page Navigation / Integration  `18 %`

| Feature | Covered | Test IDs |
|---------|---------|----------|
| Home → Customer Service (header nav) | ✅ | TC5000 |
| Home → About Us (footer nav) | ✅ | TC5001 |
| Home → Find Care (hero CTA destination) | ❌ | — |
| Home → Pay a Medical Bill (hero CTA destination) | ❌ | — |
| Home → HSA/FSA management (hero CTA destination) | ❌ | — |
| Home → Fill a Prescription (hero CTA destination) | ❌ | — |
| "Health care" / "Financial" / "Pharmacy" mega-menu routing | ❌ | — |
| Sign-in audience picker → correct portal per audience | ❌ | — |
| Footer social links open the correct external profile | ❌ | — |
| Careers → external careers site | ❌ | — |
| Search (ZIP/city input) returns a results page | ❌ | — |

**Module Coverage: 2 / 11 = 18 %**

---

### 🔴 5. Not Yet Started (0 % — no test file exists)

| Module | Why It Matters | Priority |
|--------|-----------------|----------|
| Find Care / Provider Search (`/en/care/locations.html`) | Highest-traffic conversion flow off the homepage hero | 🔴 High |
| Pharmacy (`/en/pharmacy.html` and related) | Core product line, direct revenue path | 🔴 High |
| Financial / HSA & FSA (`/en/financial.html`) | Core product line | 🔴 High |
| Patient Portal entry points | Gateway to authenticated member experience | 🟡 Medium |
| Careers site | Lower traffic, lower business risk if broken briefly | 🟢 Low |
| Accessibility (WCAG 2.1 AA — keyboard nav, ARIA labels) | Compliance requirement on a healthcare site | 🔴 High |

---

## Automation Gap Risk Matrix

| Gap | Module | Risk | Reason | Recommended Action |
|-----|--------|------|--------|---------------------|
| Find Care CTA destination | Integration | 🔴 High | #1 hero CTA; a broken provider-search entry point blocks the primary homepage conversion goal | Automate next |
| Pharmacy section | Not Started | 🔴 High | Core product line with no coverage at all | Automate next |
| Financial / HSA-FSA section | Not Started | 🔴 High | Core product line with no coverage at all | Automate next |
| Accessibility pass on Home + Customer Service | Cross-cutting | 🔴 High | WCAG 2.1 AA compliance risk on a healthcare site | Automate next sprint |
| Mega-menu routing (Health care / Financial / Pharmacy) | Home / Integration | 🟡 Medium | Secondary nav path; hero CTAs cover the primary path already | Backlog |
| Sign-in audience picker | Integration | 🟡 Medium | Feeds into external auth systems outside this suite's scope | Backlog |
| FAQ expand/collapse depth | Customer Service | 🟢 Low | Section presence is already covered; interaction depth is lower risk | Backlog |

---

## Roadmap

Current: **31 %** → Target: **60 %** in the next few sprints.

| Sprint | Focus Area | Est. New Tests | Coverage Gain |
|--------|------------|-----------------|-----------------|
| Next | Find Care CTA + provider search landing page | ~4 | +6 % |
| Next | Pharmacy section (page load + key CTAs) | ~4 | +6 % |
| Next | Financial / HSA-FSA section | ~4 | +6 % |
| Q3 | Accessibility pass (Home, Customer Service, About Us) | ~6 | +8 % |
| Q3 | Mega-menu routing (3 menus × happy path) | ~3 | +4 % |

---

*This document is maintained alongside the test suite. Re-run the suite and update the module
tables whenever a new page or feature is added to optum.com's public site, or whenever a new test
file is added to `Tests/`.*
