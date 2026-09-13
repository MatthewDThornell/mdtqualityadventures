c# Optum Playwright — Test Results Dashboard

## 🟢 All Systems Green 🟢

> **Last Updated:** 2026-08-05 18:10 UTC
> **Suite Duration:** 30s
> **Target:** `https://www.optum.com/en/`
> **Run By:** `Matty`

---

## Overall Summary

| Metric | Count |
|---|---|
| ✅ Passed | **12** |
| ❌ Failed | **0** |
| **Total** | **12** |

### Pass Rate

```
All Tests   ████████████████████  100%   12/12
```

---

## 🛡️ Defect Guard Status 🛡️

> No defect guard tests registered yet.
> Tag a test with `[Category("bug-regression")]` to monitor a previously reported bug.

---

## ⚠️ Performance — Slow Tests ⚠️

> Tests exceeding 10s may indicate a slow page load or a wait-strategy problem.

| Test                                                                                         | Duration | Module      |
|----------------------------------------------------------------------------------------------|----------|-------------|
| `OptumPlaywright.Tests.AboutUsTests.Test_Case_3001_AboutUs_HealthyOptumismSection_IsVisible` | 13.0s    | 🏢 About Us |

---

## ⚡ Page Response Times ⚡

⚠️ Some page loads exceeded the 2000ms threshold.

| Page                        | Loads | Avg    | Max     | Status  |
|-----------------------------|-------|--------|---------|---------|
| `/en/about-us.html`         | 2     | 7175ms | 12834ms | ⚠️ Slow |
| `/en/`                      | 7     | 3339ms | 8041ms  | ⚠️ Slow |
| `/en/customer-support.html` | 3     | 1923ms | 2068ms  | ⚠️ Slow |

---

## Results by Module

### 🏠 Home  `5 tests`

**Pass Rate: 100%** — 5/5

| Test                                                                                      | Result  | Duration |
|-------------------------------------------------------------------------------------------|---------|----------|
| `OptumPlaywright.Tests.HomeTests.Test_Case_1000_Home_HeroHeading_IsVisible`               | ✅ Pass | 1.2s     |
| `OptumPlaywright.Tests.HomeTests.Test_Case_1001_Home_HeaderNavLinks_ArePresentAndEnabled` | ✅ Pass | 5.6s     |
| `OptumPlaywright.Tests.HomeTests.Test_Case_1002_Home_HeroCtas_AreVisibleAndEnabled`       | ✅ Pass | 2.3s     |
| `OptumPlaywright.Tests.HomeTests.Test_Case_1003_Home_FooterLinks_ArePresent`              | ✅ Pass | 6.8s     |
| `OptumPlaywright.Tests.HomeTests.Test_Case_1004_Home_PageTitle_MatchesExpected`           | ✅ Pass | 1.2s     |

---

### 🎧 Customer Service  `3 tests`

**Pass Rate: 100%** — 3/3

| Test                                                                                                            | Result  | Duration |
|-----------------------------------------------------------------------------------------------------------------|---------|----------|
| `OptumPlaywright.Tests.CustomerServiceTests.Test_Case_2000_CustomerService_PageHeading_IsVisible`               | ✅ Pass | 2.1s     |
| `OptumPlaywright.Tests.CustomerServiceTests.Test_Case_2001_CustomerService_CommonQuestionsSection_IsVisible`    | ✅ Pass | 2.1s     |
| `OptumPlaywright.Tests.CustomerServiceTests.Test_Case_2002_CustomerService_ContactUsLink_IsPresentAndClickable` | ✅ Pass | 2.3s     |

---

### 🏢 About Us  `2 tests`

**Pass Rate: 100%** — 2/2

| Test                                                                                         | Result  | Duration |
|----------------------------------------------------------------------------------------------|---------|----------|
| `OptumPlaywright.Tests.AboutUsTests.Test_Case_3000_AboutUs_PageHeading_IsVisible`            | ✅ Pass | 1.9s     |
| `OptumPlaywright.Tests.AboutUsTests.Test_Case_3001_AboutUs_HealthyOptumismSection_IsVisible` | ✅ Pass | 13.0s    |

---

### 🔗 Integration  `2 tests`

**Pass Rate: 100%** — 2/2

| Test                                                                                                                 | Result  | Duration |
|----------------------------------------------------------------------------------------------------------------------|---------|----------|
| `OptumPlaywright.Tests.NavigationTests.Test_Case_5000_Navigation_HomeToCustomerService_HeaderNavLinkRoutesCorrectly` | ✅ Pass | 2.4s     |
| `OptumPlaywright.Tests.NavigationTests.Test_Case_5001_Navigation_HomeToAboutUs_FooterLinkRoutesCorrectly`            | ✅ Pass | 9.4s     |

---

## Full Coverage Breakdown

| Health | Module | Tests | ✅ Pass | ❌ Fail | Pass Rate |
|---|---|---|---|---|---|
| 🟢 | 🏠 Home | 5 | 5 | 0 | 100% |
| 🟢 | 🎧 Customer Service | 3 | 3 | 0 | 100% |
| 🟢 | 🏢 About Us | 2 | 2 | 0 | 100% |
| 🟢 | 🔗 Integration | 2 | 2 | 0 | 100% |
| 🟢 | **Total** | **12** | **12** | **0** | **100%** |

---

## Status Key

| Status | Meaning |
|---|---|
| ✅ Pass | Test executed and all assertions passed |
| ❌ Fail | Test executed and one or more assertions failed |
| 🟢 | Module pass rate ≥ 95% |
| 🟡 | Module pass rate 80-94% |
| 🔴 | Module pass rate < 80% |
| 🛡️ | Defect guard — written to confirm a previously reported bug stays fixed |

---

*This file is auto-generated after every test run. Do not edit manually.*
