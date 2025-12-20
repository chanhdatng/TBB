/**
 * Phase 6 - Customer Details Modal Enhancement Testing Script
 * Tests: Top Summary Bar, Behavioral Insights, Location Info
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const MODAL_FILE = './src/components/Customers/CustomerDetailsModal.jsx';

// Test Results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

function warn(message) {
  results.warnings++;
  console.log(`⚠️  WARNING: ${message}`);
}

// Read modal component
const modalCode = readFileSync(MODAL_FILE, 'utf-8');

console.log('\n=== PHASE 6: CUSTOMER DETAILS MODAL TESTING ===\n');
console.log('Testing enhancements: Top Summary Bar, Behavioral Insights, Location Info\n');

// ============================================
// 1. CODE STRUCTURE TESTS
// ============================================
console.log('1. CODE STRUCTURE & IMPORTS\n');

test('Imports LucideIcons for dynamic icons', () => {
  if (!modalCode.includes("import * as LucideIcons from 'lucide-react'")) {
    throw new Error('Missing LucideIcons import');
  }
});

test('Imports getZoneColor and getDeliveryTier utilities', () => {
  if (!modalCode.includes("getZoneColor, getDeliveryTier")) {
    throw new Error('Missing address parser utilities');
  }
});

test('Imports getCLVSegmentColor utility', () => {
  if (!modalCode.includes('getCLVSegmentColor')) {
    throw new Error('Missing CLV segment color utility');
  }
});

test('Defines formatCurrency helper', () => {
  if (!modalCode.includes('const formatCurrency = (value)')) {
    throw new Error('formatCurrency helper not found');
  }
});

test('RFMScoreBar component extracted outside main component', () => {
  const rfmBarMatch = modalCode.match(/const RFMScoreBar = /);
  const modalMatch = modalCode.match(/const CustomerDetailsModal = /);

  if (!rfmBarMatch || !modalMatch) {
    throw new Error('Components not found');
  }

  if (rfmBarMatch.index > modalMatch.index) {
    throw new Error('RFMScoreBar should be defined before CustomerDetailsModal');
  }
});

// ============================================
// 2. TOP SUMMARY BAR TESTS
// ============================================
console.log('\n2. TOP SUMMARY BAR SECTION\n');

test('Top summary bar section exists', () => {
  if (!modalCode.includes('Top Summary Bar')) {
    throw new Error('Top Summary Bar comment not found');
  }
});

test('Uses gradient background (purple-to-blue)', () => {
  if (!modalCode.includes('bg-gradient-to-r from-purple-50 to-blue-50')) {
    throw new Error('Missing gradient background');
  }
});

test('Has 4-column grid layout', () => {
  const summaryBarSection = modalCode.substring(
    modalCode.indexOf('Top Summary Bar'),
    modalCode.indexOf('RFM Scorecard')
  );

  if (!summaryBarSection.includes('grid-cols-4')) {
    throw new Error('Missing 4-column grid');
  }
});

test('CLV section with formatting', () => {
  const summaryBarSection = modalCode.substring(
    modalCode.indexOf('Top Summary Bar'),
    modalCode.indexOf('RFM Scorecard')
  );

  if (!summaryBarSection.includes('CLV Dự kiến')) {
    throw new Error('Missing CLV label');
  }

  if (!summaryBarSection.includes('formatCurrency(customer.clv)')) {
    throw new Error('CLV not formatted with formatCurrency');
  }

  if (!summaryBarSection.includes('getCLVSegmentColor(customer.clvSegment)')) {
    throw new Error('CLV segment color not applied');
  }
});

test('Health Score section with progress bar', () => {
  const summaryBarSection = modalCode.substring(
    modalCode.indexOf('Top Summary Bar'),
    modalCode.indexOf('RFM Scorecard')
  );

  if (!summaryBarSection.includes('Sức khỏe')) {
    throw new Error('Missing Health Score label');
  }

  if (!summaryBarSection.includes('customer.healthScore || 0}/100')) {
    throw new Error('Health score not displayed correctly');
  }

  if (!summaryBarSection.match(/width.*customer\.healthScore.*%/)) {
    throw new Error('Health score progress bar not found');
  }
});

test('Churn Risk section with conditional rendering', () => {
  const summaryBarSection = modalCode.substring(
    modalCode.indexOf('Top Summary Bar'),
    modalCode.indexOf('RFM Scorecard')
  );

  if (!summaryBarSection.includes('customer.churnRisk ?')) {
    throw new Error('Missing churn risk conditional');
  }

  if (!summaryBarSection.includes('customer.churnRisk.label')) {
    throw new Error('Churn risk label not displayed');
  }

  if (!summaryBarSection.includes('customer.churnRisk.color')) {
    throw new Error('Churn risk color not applied');
  }

  if (!summaryBarSection.match(/N\/A.*churnRisk/i)) {
    throw new Error('Missing N/A fallback for churn risk');
  }
});

test('Loyalty Stage section with conditional rendering', () => {
  const summaryBarSection = modalCode.substring(
    modalCode.indexOf('Top Summary Bar'),
    modalCode.indexOf('RFM Scorecard')
  );

  if (!summaryBarSection.includes('customer.loyaltyStage ?')) {
    throw new Error('Missing loyalty stage conditional');
  }

  if (!summaryBarSection.includes('customer.loyaltyStage.label')) {
    throw new Error('Loyalty stage label not displayed');
  }

  if (!summaryBarSection.includes('customer.loyaltyStage.color')) {
    throw new Error('Loyalty stage color not applied');
  }
});

// ============================================
// 3. BEHAVIORAL INSIGHTS TESTS
// ============================================
console.log('\n3. BEHAVIORAL INSIGHTS SECTION\n');

test('Behavioral Insights section exists', () => {
  if (!modalCode.includes('Behavioral Insights Card')) {
    throw new Error('Behavioral Insights comment not found');
  }
});

test('Conditional rendering on customer.behavior', () => {
  const behaviorSection = modalCode.substring(
    modalCode.indexOf('Behavioral Insights Card'),
    modalCode.indexOf('Favorite Items') - 100
  );

  if (!behaviorSection.includes('customer.behavior &&')) {
    throw new Error('Missing conditional rendering check');
  }
});

test('Has gradient blue background', () => {
  const behaviorSection = modalCode.substring(
    modalCode.indexOf('Behavioral Insights Card'),
    modalCode.indexOf('Favorite Items') - 100
  );

  if (!behaviorSection.includes('bg-blue-50/30')) {
    throw new Error('Missing blue background');
  }
});

test('Displays peak day', () => {
  const behaviorSection = modalCode.substring(
    modalCode.indexOf('Behavioral Insights Card'),
    modalCode.indexOf('Favorite Items') - 100
  );

  if (!behaviorSection.includes('customer.behavior.peakDay')) {
    throw new Error('Peak day not displayed');
  }

  if (!behaviorSection.includes('Ngày thường mua')) {
    throw new Error('Missing peak day label');
  }
});

test('Displays peak hour', () => {
  const behaviorSection = modalCode.substring(
    modalCode.indexOf('Behavioral Insights Card'),
    modalCode.indexOf('Favorite Items') - 100
  );

  if (!behaviorSection.includes('customer.behavior.peakHour')) {
    throw new Error('Peak hour not displayed');
  }

  if (!behaviorSection.includes('Giờ thường mua')) {
    throw new Error('Missing peak hour label');
  }
});

test('Displays average days between orders', () => {
  const behaviorSection = modalCode.substring(
    modalCode.indexOf('Behavioral Insights Card'),
    modalCode.indexOf('Favorite Items') - 100
  );

  if (!behaviorSection.includes('customer.behavior.avgDaysBetweenOrders')) {
    throw new Error('Avg days between orders not displayed');
  }

  if (!behaviorSection.includes('Khoảng cách đơn TB')) {
    throw new Error('Missing avg days label');
  }
});

test('Has N/A fallbacks for behavior metrics', () => {
  const behaviorSection = modalCode.substring(
    modalCode.indexOf('Behavioral Insights Card'),
    modalCode.indexOf('Favorite Items') - 100
  );

  const naFallbacks = (behaviorSection.match(/N\/A/g) || []).length;
  if (naFallbacks < 3) {
    throw new Error(`Expected 3 N/A fallbacks, found ${naFallbacks}`);
  }
});

// ============================================
// 4. LOCATION INFO TESTS
// ============================================
console.log('\n4. LOCATION INFO SECTION\n');

test('Location Info section exists', () => {
  if (!modalCode.includes('Location Info Card')) {
    throw new Error('Location Info comment not found');
  }
});

test('Conditional rendering on customer.location', () => {
  const locationSection = modalCode.substring(
    modalCode.indexOf('Location Info Card'),
    modalCode.indexOf('Order History')
  );

  if (!locationSection.includes('customer.location &&')) {
    throw new Error('Missing conditional rendering check');
  }
});

test('Has 3-column grid', () => {
  const locationSection = modalCode.substring(
    modalCode.indexOf('Location Info Card'),
    modalCode.indexOf('Order History')
  );

  if (!locationSection.includes('grid-cols-3')) {
    throw new Error('Missing 3-column grid');
  }
});

test('Displays district', () => {
  const locationSection = modalCode.substring(
    modalCode.indexOf('Location Info Card'),
    modalCode.indexOf('Order History')
  );

  if (!locationSection.includes('customer.location.district')) {
    throw new Error('District not displayed');
  }

  if (!locationSection.includes('Quận/Huyện')) {
    throw new Error('Missing district label');
  }
});

test('Displays zone with color coding', () => {
  const locationSection = modalCode.substring(
    modalCode.indexOf('Location Info Card'),
    modalCode.indexOf('Order History')
  );

  if (!locationSection.includes('customer.location.zone')) {
    throw new Error('Zone not displayed');
  }

  if (!locationSection.includes('getZoneColor(customer.location.zone)')) {
    throw new Error('Zone color not applied');
  }

  if (!locationSection.includes('Khu vực')) {
    throw new Error('Missing zone label');
  }
});

test('Displays delivery tier with calculation', () => {
  const locationSection = modalCode.substring(
    modalCode.indexOf('Location Info Card'),
    modalCode.indexOf('Order History')
  );

  if (!locationSection.includes('getDeliveryTier(customer.location.district)')) {
    throw new Error('Delivery tier not calculated');
  }

  if (!locationSection.includes('Tier giao hàng')) {
    throw new Error('Missing delivery tier label');
  }
});

// ============================================
// 5. LAYOUT & ORDER TESTS
// ============================================
console.log('\n5. LAYOUT & COMPONENT ORDER\n');

test('Section order: Header → Summary → RFM → Stats → Purchase → Behavior → Favorites → Location → Orders', () => {
  const headerPos = modalCode.indexOf('Header');
  const summaryPos = modalCode.indexOf('Top Summary Bar');
  const rfmPos = modalCode.indexOf('RFM Scorecard');
  const statsPos = modalCode.indexOf('Stats');
  const purchasePos = modalCode.indexOf('Purchase Metrics');
  const behaviorPos = modalCode.indexOf('Behavioral Insights Card');
  const favoritesPos = modalCode.indexOf('Favorite Items');
  const locationPos = modalCode.indexOf('Location Info Card');
  const ordersPos = modalCode.indexOf('Order History');

  if (!(headerPos < summaryPos && summaryPos < rfmPos && rfmPos < statsPos &&
        statsPos < purchasePos && purchasePos < behaviorPos && behaviorPos < favoritesPos &&
        favoritesPos < locationPos && locationPos < ordersPos)) {
    throw new Error('Sections not in correct order');
  }
});

test('All sections have proper border-b dividers', () => {
  const sections = [
    'Top Summary Bar',
    'RFM Scorecard',
    'Stats',
    'Purchase Metrics',
    'Behavioral Insights Card',
    'Favorite Items',
    'Location Info Card'
  ];

  sections.forEach(section => {
    const sectionStart = modalCode.indexOf(section);
    const sectionCode = modalCode.substring(sectionStart, sectionStart + 500);

    if (!sectionCode.includes('border-b')) {
      warn(`Section "${section}" may be missing border-b divider`);
    }
  });
});

test('Responsive grid classes used consistently', () => {
  const responsivePatterns = [
    'grid-cols-4',
    'grid-cols-3',
    'md:grid-cols-3'
  ];

  responsivePatterns.forEach(pattern => {
    if (!modalCode.includes(pattern)) {
      warn(`Missing responsive grid pattern: ${pattern}`);
    }
  });
});

// ============================================
// 6. STYLING CONSISTENCY TESTS
// ============================================
console.log('\n6. STYLING & DESIGN CONSISTENCY\n');

test('Uses consistent gradient backgrounds', () => {
  const gradients = [
    'bg-gradient-to-r from-purple-50 to-blue-50', // Summary bar
    'bg-gradient-to-br from-gray-50/50 to-white', // RFM
    'bg-blue-50/30' // Behavioral
  ];

  gradients.forEach(gradient => {
    if (!modalCode.includes(gradient)) {
      warn(`Missing gradient: ${gradient}`);
    }
  });
});

test('Consistent typography hierarchy', () => {
  const typographyClasses = [
    'text-2xl font-bold', // Large values
    'text-lg font-bold',  // Section headers
    'text-xs text-gray-600' // Labels
  ];

  typographyClasses.forEach(cls => {
    if (!modalCode.includes(cls)) {
      warn(`Typography class "${cls}" not found`);
    }
  });
});

test('Consistent spacing (p-6 for sections)', () => {
  const sections = modalCode.match(/p-6/g);
  if (!sections || sections.length < 5) {
    warn('Inconsistent section padding (p-6)');
  }
});

test('Uses rounded corners consistently', () => {
  const roundedClasses = ['rounded-lg', 'rounded-full', 'rounded-2xl'];
  roundedClasses.forEach(cls => {
    if (!modalCode.includes(cls)) {
      warn(`Rounded class "${cls}" not found`);
    }
  });
});

// ============================================
// 7. ACCESSIBILITY & UX TESTS
// ============================================
console.log('\n7. ACCESSIBILITY & UX\n');

test('All labels use Vietnamese language', () => {
  const vietnameseLabels = [
    'CLV Dự kiến',
    'Sức khỏe',
    'Rủi ro',
    'Giai đoạn',
    'Hành vi mua hàng',
    'Ngày thường mua',
    'Giờ thường mua',
    'Khoảng cách đơn TB',
    'Thông tin địa lý',
    'Quận/Huyện',
    'Khu vực',
    'Tier giao hàng'
  ];

  vietnameseLabels.forEach(label => {
    if (!modalCode.includes(label)) {
      throw new Error(`Missing Vietnamese label: ${label}`);
    }
  });
});

test('N/A fallbacks for missing data', () => {
  const naCount = (modalCode.match(/N\/A/g) || []).length;
  if (naCount < 8) {
    throw new Error(`Expected at least 8 N/A fallbacks, found ${naCount}`);
  }
});

test('Conditional rendering prevents errors', () => {
  const conditionalChecks = [
    'customer.behavior &&',
    'customer.location &&',
    'customer.churnRisk ?',
    'customer.loyaltyStage ?',
    'customer.clvSegment &&'
  ];

  conditionalChecks.forEach(check => {
    if (!modalCode.includes(check)) {
      throw new Error(`Missing conditional check: ${check}`);
    }
  });
});

// ============================================
// 8. PERFORMANCE TESTS
// ============================================
console.log('\n8. PERFORMANCE CONSIDERATIONS\n');

test('useMemo used for expensive calculations', () => {
  if (!modalCode.includes('useMemo')) {
    throw new Error('useMemo not used for purchaseMetrics');
  }
});

test('Component extraction prevents re-renders', () => {
  if (!modalCode.includes('const RFMScoreBar = ({ label, score')) {
    throw new Error('RFMScoreBar not extracted as separate component');
  }
});

test('No inline functions in render (performance)', () => {
  // Check for common inline function patterns
  const inlineFunctionPattern = /className=\{.*\(\).*=>/;
  const matches = modalCode.match(inlineFunctionPattern);

  if (matches && matches.length > 2) {
    warn('Multiple inline functions detected in render - may impact performance');
  }
});

// ============================================
// SUMMARY
// ============================================
console.log('\n\n=== TEST SUMMARY ===\n');
console.log(`Total Tests: ${results.passed + results.failed}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

const score = Math.round((results.passed / (results.passed + results.failed)) * 100);
console.log(`\nQuality Score: ${score}/100`);

if (results.failed > 0) {
  console.log('\nFailed Tests:');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
}

console.log('\n=== NEXT STEPS ===');
console.log('1. Start dev server: npm run dev');
console.log('2. Navigate to Customers page');
console.log('3. Click customer cards to test modal');
console.log('4. Test with different customer types (VIP, new, partial data)');
console.log('5. Test responsive layout (resize browser)');
console.log('6. Monitor console for errors');
console.log('7. Verify all sections render correctly');

process.exit(results.failed > 0 ? 1 : 0);
