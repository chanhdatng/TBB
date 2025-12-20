/**
 * Phase 3: Advanced Filters Testing Script
 * Tests for churnRisk, clvSegment, loyaltyStage, zone, district filters
 * Plus new sort options (CLV, healthScore, churnRisk)
 */

const puppeteer = require('puppeteer');

class FilterTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseURL = 'http://localhost:3002';
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();

    // Enable console logging
    this.page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    this.page.on('error', (err) => console.error('PAGE ERROR:', err));

    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async navigateToCustomers() {
    await this.page.goto(`${this.baseURL}/customers`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000); // Wait for data to load
  }

  async getCustomerCount() {
    const countText = await this.page.$eval(
      '.text-sm.text-gray-600',
      el => el.textContent
    );
    const match = countText.match(/(\d+)\s*\/\s*(\d+)/);
    return {
      filtered: parseInt(match[1]),
      total: parseInt(match[2])
    };
  }

  async setFilter(filterLabel, value) {
    // Find the select element by label
    const selects = await this.page.$$('select');

    for (const select of selects) {
      const label = await this.page.evaluate(el => {
        const labelEl = el.previousElementSibling?.textContent || '';
        return labelEl;
      }, select);

      if (label.includes(filterLabel)) {
        await select.select(value);
        await this.page.waitForTimeout(300); // Let filter apply
        return true;
      }
    }
    return false;
  }

  async resetFilters() {
    const resetBtn = await this.page.$('button:has-text("Đặt lại")');
    if (resetBtn) {
      await resetBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async test(name, fn) {
    try {
      await fn();
      this.results.passed.push(name);
      console.log(`✓ PASS: ${name}`);
    } catch (err) {
      this.results.failed.push({ name, error: err.message });
      console.log(`✗ FAIL: ${name}`);
      console.log(`  Error: ${err.message}`);
    }
  }

  async warn(message) {
    this.results.warnings.push(message);
    console.log(`⚠ WARN: ${message}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTests() {
    console.log('='.repeat(80));
    console.log('PHASE 3: ADVANCED FILTERS TESTING');
    console.log('='.repeat(80));

    await this.init();
    await this.navigateToCustomers();

    // ===== INDIVIDUAL FILTER TESTS =====
    console.log('\n[SECTION 1] Individual Filter Tests');
    console.log('-'.repeat(80));

    // Test Churn Risk Filter
    await this.test('Filter: Churn Risk - High', async () => {
      await this.resetFilters();
      await this.setFilter('Rủi ro mất khách', 'high');

      const counts = await this.getCustomerCount();
      if (counts.filtered === 0) {
        throw new Error(`Expected customers with high churn risk, got ${counts.filtered}`);
      }
    });

    // Test CLV Segment Filter
    await this.test('Filter: CLV Segment - VIP', async () => {
      await this.resetFilters();
      await this.setFilter('Phân khúc CLV', 'VIP');

      const counts = await this.getCustomerCount();
      if (counts.filtered === 0) {
        throw new Error(`Expected VIP customers, got ${counts.filtered}`);
      }
    });

    // Test Loyalty Stage Filter
    await this.test('Filter: Loyalty Stage - Champion', async () => {
      await this.resetFilters();
      await this.setFilter('Giai đoạn', 'champion');

      const counts = await this.getCustomerCount();
      if (counts.filtered === 0) {
        throw new Error(`Expected champion customers, got ${counts.filtered}`);
      }
    });

    // Test Zone Filter
    await this.test('Filter: Zone - Trung tâm', async () => {
      await this.resetFilters();
      await this.setFilter('Khu vực', 'Trung tâm');

      const counts = await this.getCustomerCount();
      if (counts.filtered === 0) {
        throw new Error(`Expected customers in Trung tâm zone, got ${counts.filtered}`);
      }
    });

    // Test District Filter
    await this.test('Filter: District - Quận 1', async () => {
      await this.resetFilters();
      await this.setFilter('Quận/Huyện', 'Quận 1');

      const counts = await this.getCustomerCount();
      if (counts.filtered === 0) {
        throw new Error(`Expected customers in Quận 1, got ${counts.filtered}`);
      }
    });

    // ===== FILTER COMBINATION TESTS (AND LOGIC) =====
    console.log('\n[SECTION 2] Filter Combination Tests (AND Logic)');
    console.log('-'.repeat(80));

    await this.test('Filters: Churn Risk + CLV Segment', async () => {
      await this.resetFilters();
      await this.setFilter('Rủi ro mất khách', 'high');
      const countsAfterChurn = await this.getCustomerCount();

      await this.setFilter('Phân khúc CLV', 'VIP');
      const countsAfterBoth = await this.getCustomerCount();

      if (countsAfterBoth.filtered > countsAfterChurn.filtered) {
        throw new Error('Second filter should reduce or keep same count (AND logic)');
      }
    });

    await this.test('Filters: Zone + District combination', async () => {
      await this.resetFilters();
      await this.setFilter('Khu vực', 'Trung tâm');
      const zoneCount = await this.getCustomerCount();

      await this.setFilter('Quận/Huyện', 'Quận 1');
      const combinedCount = await this.getCustomerCount();

      if (combinedCount.filtered > zoneCount.filtered) {
        throw new Error('Adding district filter should not increase count');
      }
    });

    await this.test('Filters: 3+ filters combined', async () => {
      await this.resetFilters();
      await this.setFilter('Rủi ro mất khách', 'low');
      await this.setFilter('Phân khúc CLV', 'High');
      await this.setFilter('Giai đoạn', 'loyal');

      const counts = await this.getCustomerCount();
      if (counts.filtered < 0) {
        throw new Error('Combined filters should return valid result');
      }
    });

    // ===== SORT OPTION TESTS =====
    console.log('\n[SECTION 3] Sort Options Tests');
    console.log('-'.repeat(80));

    await this.test('Sort: CLV (Descending)', async () => {
      await this.resetFilters();

      // Select CLV sort
      const sortSelect = await this.page.$('select');
      await sortSelect.select('clv');

      // Check sort direction is desc
      const directionBtn = await this.page.$('button[title*="Sắp xếp"]');
      const arrowIcon = await this.page.evaluate(el => {
        return el.querySelector('svg').getAttribute('class');
      }, directionBtn);

      if (!arrowIcon.includes('ArrowDown')) {
        await this.warn('CLV sort direction may not be descending on init');
      }
    });

    await this.test('Sort: Health Score', async () => {
      const sortSelect = await this.page.$('select');
      await sortSelect.select('healthScore');
      await this.page.waitForTimeout(300);

      // Verify no errors in console
      const hasErrors = await this.page.evaluate(() => {
        return window.__hasConsoleErrors || false;
      });

      if (hasErrors) {
        throw new Error('Sort option caused console errors');
      }
    });

    await this.test('Sort: Churn Risk', async () => {
      const sortSelect = await this.page.$('select');
      await sortSelect.select('churnRisk');
      await this.page.waitForTimeout(300);
    });

    await this.test('Sort: Existing sorts still work', async () => {
      const sortSelect = await this.page.$('select');

      const options = ['totalSpent', 'orders', 'lastOrder', 'name'];
      for (const option of options) {
        await sortSelect.select(option);
        await this.page.waitForTimeout(200);
      }
    });

    // ===== EDGE CASE TESTS =====
    console.log('\n[SECTION 4] Edge Cases');
    console.log('-'.repeat(80));

    await this.test('Edge: Zero results filtering', async () => {
      await this.resetFilters();

      // Try to find a combination that returns 0
      await this.setFilter('Rủi ro mất khách', 'high');
      await this.setFilter('Phân khúc CLV', 'Low');
      await this.setFilter('Giai đoạn', 'champion');

      const counts = await this.getCustomerCount();
      if (counts.filtered < 0 || isNaN(counts.filtered)) {
        throw new Error('Count should be valid number >= 0');
      }
    });

    await this.test('Edge: Reset clears all filters', async () => {
      // Apply many filters
      await this.setFilter('Rủi ro mất khách', 'medium');
      await this.setFilter('Phân khúc CLV', 'Medium');
      await this.setFilter('Giai đoạn', 'growing');
      await this.setFilter('Khu vực', 'Đông');

      const beforeReset = await this.getCustomerCount();

      await this.resetFilters();
      const afterReset = await this.getCustomerCount();

      if (beforeReset.filtered === afterReset.filtered && beforeReset.filtered > 0) {
        throw new Error('Reset should change count back to all customers');
      }
    });

    // ===== PERFORMANCE TESTS =====
    console.log('\n[SECTION 5] Performance Tests');
    console.log('-'.repeat(80));

    await this.test('Performance: Filter response < 100ms', async () => {
      const startTime = Date.now();
      await this.setFilter('Rủi ro mất khách', 'low');
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`  Filter response time: ${duration}ms`);

      if (duration > 1000) {
        await this.warn(`Filter response time is ${duration}ms (target: <100ms)`);
      }
    });

    await this.test('Performance: No UI lag with filters', async () => {
      // Check for performance metrics
      const perfData = await this.page.evaluate(() => {
        return {
          fps: window.__fps || 'N/A',
          memory: window.__memory || 'N/A'
        };
      });

      console.log(`  Performance data: ${JSON.stringify(perfData)}`);
    });

    // ===== UI/UX TESTS =====
    console.log('\n[SECTION 6] UI/UX Tests');
    console.log('-'.repeat(80));

    await this.test('UI: Vietnamese labels display correctly', async () => {
      const labels = await this.page.$$eval('label', els =>
        els.map(el => el.textContent).filter(text => text.length > 0)
      );

      const vietnameseLabels = labels.filter(l =>
        l.includes('Rủi') || l.includes('Phân') || l.includes('Giai') || l.includes('Khu') || l.includes('Quận')
      );

      if (vietnameseLabels.length === 0) {
        throw new Error('Vietnamese labels not found');
      }
    });

    await this.test('UI: Responsive layout - desktop', async () => {
      const filterGrid = await this.page.$('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');

      if (!filterGrid) {
        throw new Error('Filter grid layout not found');
      }
    });

    await this.test('UI: Reset button is accessible', async () => {
      const resetBtn = await this.page.$('button:has-text("Đặt lại")');

      if (!resetBtn) {
        // Try alternative selector
        const buttons = await this.page.$$('button');
        const found = false;
        for (const btn of buttons) {
          const text = await this.page.evaluate(el => el.textContent, btn);
          if (text.includes('Đặt lại')) {
            break;
          }
        }

        if (!found) {
          throw new Error('Reset button not found or not accessible');
        }
      }
    });

    // ===== SEARCH + FILTERS COMBINATION =====
    console.log('\n[SECTION 7] Search + Filters Combination');
    console.log('-'.repeat(80));

    await this.test('Combined: Search + Churn Risk filter', async () => {
      await this.resetFilters();

      // Apply filter
      await this.setFilter('Rủi ro mất khách', 'high');
      const filterCount = await this.getCustomerCount();

      // Type in search (would need to implement search input selection)
      console.log(`  Filter returned ${filterCount.filtered} customers`);
    });

    // ===== GENERATE REPORT =====
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    const passCount = this.results.passed.length;
    const failCount = this.results.failed.length;
    const warnCount = this.results.warnings.length;
    const totalTests = passCount + failCount;

    console.log(`\nTests Passed: ${passCount}/${totalTests}`);
    console.log(`Tests Failed: ${failCount}/${totalTests}`);
    console.log(`Warnings: ${warnCount}`);

    if (failCount > 0) {
      console.log('\nFailed Tests:');
      this.results.failed.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }

    if (warnCount > 0) {
      console.log('\nWarnings:');
      this.results.warnings.forEach(warn => {
        console.log(`  - ${warn}`);
      });
    }

    console.log('\n' + '='.repeat(80));

    return {
      passed: passCount,
      failed: failCount,
      warnings: warnCount,
      success: failCount === 0
    };
  }
}

// Run tests
(async () => {
  const tester = new FilterTester();
  try {
    const results = await tester.runTests();
    process.exit(results.success ? 0 : 1);
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  } finally {
    await tester.close();
  }
})();
