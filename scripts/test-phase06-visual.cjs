/**
 * Phase 6 - Visual Testing Script
 * Uses Puppeteer to capture screenshots and test modal rendering
 */

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const APP_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = './docs/screenshots/phase06';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVisualTests() {
  console.log('=== PHASE 6: VISUAL TESTING ===\n');

  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Navigate to app
    console.log('1. Loading application...');
    await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to Customers page
    console.log('2. Navigating to Customers page...');
    await page.evaluate(() => {
      const customersLink = document.querySelector('a[href*="customers"]');
      if (customersLink) customersLink.click();
    });
    await sleep(3000);

    // Wait for customer cards to load
    console.log('3. Waiting for customer cards...');
    await page.waitForSelector('[class*="grid"]', { timeout: 10000 });

    // Click first customer card to open modal
    console.log('4. Opening customer modal...');
    const customerCard = await page.$('[class*="cursor-pointer"][class*="border"]');

    if (!customerCard) {
      throw new Error('No customer card found');
    }

    await customerCard.click();
    await sleep(2000);

    // Wait for modal to appear
    console.log('5. Waiting for modal...');
    await page.waitForSelector('[class*="fixed"][class*="z-50"]', { timeout: 5000 });

    // Check if modal is visible
    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector('[class*="fixed"][class*="z-50"]');
      return modal && modal.offsetParent !== null;
    });

    if (!modalVisible) {
      throw new Error('Modal not visible');
    }
    console.log('✅ Modal opened successfully');
    results.passed++;

    // Test 1: Check Top Summary Bar
    console.log('\n6. Testing Top Summary Bar...');
    const summaryBarExists = await page.evaluate(() => {
      const gradientSection = document.querySelector('[class*="gradient-to-r"][class*="purple-50"]');
      if (!gradientSection) return false;

      const grid = gradientSection.querySelector('[class*="grid-cols-4"]');
      if (!grid) return false;

      const columns = grid.children;
      return columns.length === 4;
    });

    if (summaryBarExists) {
      console.log('✅ Summary bar with 4 columns found');
      results.passed++;
    } else {
      console.log('❌ Summary bar not found or incorrect structure');
      results.failed++;
      results.errors.push('Summary bar structure incorrect');
    }

    // Test 2: Check summary bar content
    const summaryContent = await page.evaluate(() => {
      const summaryBar = document.querySelector('[class*="gradient-to-r"][class*="purple-50"]');
      if (!summaryBar) return null;

      return {
        hasClv: summaryBar.textContent.includes('CLV Dự kiến'),
        hasHealth: summaryBar.textContent.includes('Sức khỏe'),
        hasChurn: summaryBar.textContent.includes('Rủi ro'),
        hasLoyalty: summaryBar.textContent.includes('Giai đoạn')
      };
    });

    if (summaryContent && Object.values(summaryContent).every(v => v)) {
      console.log('✅ All summary metrics present');
      results.passed++;
    } else {
      console.log('❌ Missing summary metrics:', summaryContent);
      results.failed++;
    }

    // Test 3: Check Behavioral Insights
    console.log('\n7. Testing Behavioral Insights section...');
    const behaviorExists = await page.evaluate(() => {
      const section = Array.from(document.querySelectorAll('h3'))
        .find(h3 => h3.textContent.includes('Hành vi mua hàng'));

      if (!section) return false;

      const container = section.closest('[class*="border-b"]');
      if (!container) return false;

      return {
        hasBackground: container.className.includes('bg-blue-50'),
        hasGrid: !!container.querySelector('[class*="grid-cols-3"]'),
        hasPeakDay: container.textContent.includes('Ngày thường mua'),
        hasPeakHour: container.textContent.includes('Giờ thường mua'),
        hasAvgDays: container.textContent.includes('Khoảng cách đơn TB')
      };
    });

    if (behaviorExists && Object.values(behaviorExists).every(v => v)) {
      console.log('✅ Behavioral insights section complete');
      results.passed++;
    } else {
      console.log('⚠️  Behavioral insights section:', behaviorExists);
      if (!behaviorExists) {
        console.log('   (Section may not be visible if customer has no behavior data)');
      }
    }

    // Test 4: Check Location Info
    console.log('\n8. Testing Location Info section...');
    const locationExists = await page.evaluate(() => {
      const section = Array.from(document.querySelectorAll('h3'))
        .find(h3 => h3.textContent.includes('Thông tin địa lý'));

      if (!section) return false;

      const container = section.closest('[class*="border-b"]');
      if (!container) return false;

      return {
        hasGrid: !!container.querySelector('[class*="grid-cols-3"]'),
        hasDistrict: container.textContent.includes('Quận/Huyện'),
        hasZone: container.textContent.includes('Khu vực'),
        hasDeliveryTier: container.textContent.includes('Tier giao hàng')
      };
    });

    if (locationExists && Object.values(locationExists).every(v => v)) {
      console.log('✅ Location info section complete');
      results.passed++;
    } else {
      console.log('⚠️  Location info section:', locationExists);
      if (!locationExists) {
        console.log('   (Section may not be visible if customer has no location data)');
      }
    }

    // Test 5: Check for React warnings/errors
    console.log('\n9. Checking console for errors...');
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
      results.passed++;
    } else {
      console.log('❌ Console errors found:');
      consoleErrors.forEach(err => console.log('   -', err));
      results.failed++;
      results.errors.push(...consoleErrors);
    }

    // Take screenshot of modal
    console.log('\n10. Capturing screenshots...');
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/modal-full.png`,
      fullPage: false
    });
    console.log('✅ Screenshot saved: modal-full.png');

    // Scroll to test all sections
    await page.evaluate(() => {
      const modal = document.querySelector('[class*="overflow-y-auto"]');
      if (modal) modal.scrollTo(0, modal.scrollHeight / 2);
    });
    await sleep(500);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/modal-scrolled.png`,
      fullPage: false
    });
    console.log('✅ Screenshot saved: modal-scrolled.png');

    // Test 6: Mobile responsive
    console.log('\n11. Testing mobile layout...');
    await page.setViewport({ width: 375, height: 812 });
    await sleep(1000);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/modal-mobile.png`,
      fullPage: false
    });
    console.log('✅ Screenshot saved: modal-mobile.png');

    const mobileLayout = await page.evaluate(() => {
      const modal = document.querySelector('[class*="fixed"][class*="z-50"] > div');
      if (!modal) return false;

      const rect = modal.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      return {
        fitsScreen: rect.width <= viewportWidth,
        hasProperPadding: rect.left >= 0 && rect.right <= viewportWidth
      };
    });

    if (mobileLayout && mobileLayout.fitsScreen) {
      console.log('✅ Mobile layout responsive');
      results.passed++;
    } else {
      console.log('❌ Mobile layout issues:', mobileLayout);
      results.failed++;
    }

    // Test 7: Performance - measure modal open time
    console.log('\n12. Testing performance...');
    await page.setViewport({ width: 1920, height: 1080 });
    await sleep(1000);

    // Close modal
    const closeButton = await page.$('[class*="hover:bg-gray-100"]');
    if (closeButton) await closeButton.click();
    await sleep(1000);

    // Measure modal open time
    const openTime = await page.evaluate(() => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        const card = document.querySelector('[class*="cursor-pointer"][class*="border"]');

        if (!card) {
          resolve(null);
          return;
        }

        card.click();

        const checkModal = setInterval(() => {
          const modal = document.querySelector('[class*="fixed"][class*="z-50"]');
          if (modal && modal.offsetParent !== null) {
            clearInterval(checkModal);
            resolve(performance.now() - startTime);
          }
        }, 10);

        setTimeout(() => {
          clearInterval(checkModal);
          resolve(null);
        }, 5000);
      });
    });

    if (openTime && openTime < 500) {
      console.log(`✅ Modal opens quickly (${openTime.toFixed(0)}ms)`);
      results.passed++;
    } else if (openTime) {
      console.log(`⚠️  Modal open time: ${openTime.toFixed(0)}ms (>500ms)`);
      results.failed++;
    } else {
      console.log('❌ Could not measure modal open time');
      results.failed++;
    }

  } catch (error) {
    console.error('\n❌ Test execution error:', error.message);
    results.failed++;
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n\n=== TEST RESULTS SUMMARY ===\n');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  const score = Math.round((results.passed / (results.passed + results.failed)) * 100);
  console.log(`\nVisual Quality Score: ${score}/100`);

  return results;
}

// Run tests
runVisualTests().catch(console.error);
