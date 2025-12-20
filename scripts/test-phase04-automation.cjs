import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function testPhase04() {
  console.log('Starting Phase 04 Test Automation...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to login
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#username', { timeout: 5000 });
    
    // Step 2: Login
    console.log('Step 2: Logging in...');
    await page.type('#username', 'admin');
    await page.type('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    // Step 3: Navigate to customers page
    console.log('Step 3: Navigating to customers page...');
    await page.goto('http://localhost:3001/customers', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.grid', { timeout: 10000 });
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Step 4: Capture Grid View screenshot
    console.log('Step 4: Capturing Grid View screenshot...');
    await page.screenshot({ 
      path: './docs/screenshots/phase04-grid-view.png',
      fullPage: true 
    });
    
    // Step 5: Extract console logs for data validation
    console.log('Step 5: Extracting console verification logs...');
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('PHASE 1 VERIFICATION') || 
          msg.text().includes('CLV') || 
          msg.text().includes('Churn Risk') ||
          msg.text().includes('Enriched')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Reload to capture console logs
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Step 6: Switch to List View
    console.log('Step 6: Switching to List View...');
    await page.click('button[aria-label="List view"]').catch(() => {
      // Try alternative selector
      return page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const listButton = buttons.find(btn => btn.querySelector('svg') && btn.classList.contains('rounded-md'));
        if (listButton) listButton.click();
      });
    });
    
    await page.waitForTimeout(1000);
    
    // Step 7: Capture List View screenshot  
    console.log('Step 7: Capturing List View screenshot...');
    await page.screenshot({ 
      path: './docs/screenshots/phase04-list-view.png',
      fullPage: true 
    });
    
    // Step 8: Test filter interaction
    console.log('Step 8: Testing CLV filter...');
    await page.select('select', 'VIP').catch(() => console.log('CLV filter not found'));
    await page.waitForTimeout(500);
    
    // Step 9: Extract customer data sample
    console.log('Step 9: Extracting customer data sample...');
    const customerData = await page.evaluate(() => {
      const customers = [];
      const cards = document.querySelectorAll('[class*="bg-white"][class*="rounded-xl"]');
      
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        const card = cards[i];
        customers.push({
          hasAvatar: !!card.querySelector('[class*="rounded"]'),
          hasChurnDot: !!card.querySelector('[class*="absolute"][class*="rounded-full"]'),
          hasCLVBadge: !!card.querySelector('[class*="px-2"][class*="py-0.5"][class*="rounded-full"]'),
          hasHealthBar: !!card.querySelector('[class*="bg-gray-200"][class*="rounded-full"]'),
          hasZoneLabel: card.textContent.includes('Trung tâm') || 
                       card.textContent.includes('Đông') ||
                       card.textContent.includes('Nam')
        });
      }
      
      return customers;
    });
    
    console.log('\n=== SAMPLE CUSTOMER DATA ===');
    console.log(JSON.stringify(customerData, null, 2));
    
    // Step 10: Check for console errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Grid View Screenshot:', fs.existsSync('./docs/screenshots/phase04-grid-view.png') ? '✓ Saved' : '✗ Failed');
    console.log('List View Screenshot:', fs.existsSync('./docs/screenshots/phase04-list-view.png') ? '✓ Saved' : '✗ Failed');
    console.log('Console Errors:', errors.length === 0 ? '✓ None' : `✗ ${errors.length} errors`);
    console.log('Sample Customers:', customerData.length > 0 ? `✓ ${customerData.length} analyzed` : '✗ None found');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\nTest automation complete.');
  }
}

testPhase04();
