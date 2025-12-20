/**
 * PHASE 7 - CSV EXPORT FUNCTIONALITY TEST
 * Tests CustomerExport component integration and CSV generation logic
 */

const fs = require('fs');
const path = require('path');

const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

function test(name, fn) {
  results.total++;
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS', error: null });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertIncludes(content, substring, message) {
  assert(content.includes(substring), message || `Expected content to include "${substring}"`);
}

console.log('=== PHASE 7: CSV EXPORT FUNCTIONALITY TEST ===\n');

// Read component files
const exportComponentPath = path.join(__dirname, 'src/components/Customers/CustomerExport.jsx');
const customersPagePath = path.join(__dirname, 'src/pages/Customers.jsx');

const exportComponent = fs.readFileSync(exportComponentPath, 'utf8');
const customersPage = fs.readFileSync(customersPagePath, 'utf8');

console.log('1. COMPONENT INTEGRATION TESTS\n');

test('CustomerExport component exists', () => {
  assert(fs.existsSync(exportComponentPath), 'CustomerExport.jsx file should exist');
});

test('CustomerExport is imported in Customers.jsx', () => {
  assertIncludes(customersPage, "import CustomerExport from '../components/Customers/CustomerExport'",
    'CustomerExport should be imported');
});

test('CustomerExport is rendered in toolbar', () => {
  assertIncludes(customersPage, '<CustomerExport customers={filteredCustomers} />',
    'CustomerExport should be rendered with filteredCustomers prop');
});

test('Export button has correct icon', () => {
  assertIncludes(exportComponent, 'import { Download }', 'Download icon should be imported');
  assertIncludes(exportComponent, '<Download size={18} />', 'Download icon should be used');
});

test('Export button has correct styling', () => {
  assertIncludes(exportComponent, 'bg-green-500', 'Button should have green background');
  assertIncludes(exportComponent, 'hover:bg-green-600', 'Button should have hover state');
  assertIncludes(exportComponent, 'text-white', 'Button text should be white');
});

console.log('\n2. CSV FUNCTIONALITY TESTS\n');

test('exportToCSV function exists', () => {
  assertIncludes(exportComponent, 'const exportToCSV = () => {',
    'exportToCSV function should be defined');
});

test('CSV has all 24 required headers', () => {
  const requiredHeaders = [
    'Tên', 'Số điện thoại', 'Email', 'Địa chỉ',
    'Số đơn', 'Tổng chi tiêu', 'AOV', 'CLV', 'CLV Segment',
    'RFM_R', 'RFM_F', 'RFM_M', 'RFM_Segment',
    'Health Score', 'Churn Risk', 'Loyalty Stage',
    'Trend %', 'Peak Day', 'Peak Hour', 'Avg Days Between Orders',
    'District', 'Zone', 'Cohort Month', 'Cohort Quarter'
  ];

  requiredHeaders.forEach(header => {
    assertIncludes(exportComponent, `'${header}'`, `Header "${header}" should be present`);
  });
});

test('CSV data mapping includes all customer metrics', () => {
  const requiredFields = [
    'c.name', 'c.phone', 'c.email', 'c.address',
    'c.orders', 'c.totalSpent', 'c.aov', 'c.clv', 'c.clvSegment',
    'c.rfm?.R', 'c.rfm?.F', 'c.rfm?.M', 'c.rfm?.segment',
    'c.healthScore', 'c.churnRisk?.level', 'c.loyaltyStage?.stage',
    'c.trend', 'c.behavior?.peakDay', 'c.behavior?.peakHour', 'c.behavior?.avgDaysBetweenOrders',
    'c.location?.district', 'c.location?.zone', 'c.cohort?.monthly', 'c.cohort?.quarterly'
  ];

  requiredFields.forEach(field => {
    assertIncludes(exportComponent, field, `Field mapping "${field}" should be present`);
  });
});

console.log('\n3. CSV FORMAT TESTS\n');

test('UTF-8 BOM is added for Vietnamese characters', () => {
  assertIncludes(exportComponent, "'\\uFEFF'", 'UTF-8 BOM should be added');
  assertIncludes(exportComponent, "type: 'text/csv;charset=utf-8;'",
    'CSV mime type should include UTF-8 charset');
});

test('Filename format is correct', () => {
  assertIncludes(exportComponent, 'customers_export_', 'Filename should start with customers_export_');
  assertIncludes(exportComponent, "new Date().toISOString().split('T')[0]",
    'Filename should include ISO date');
  assertIncludes(exportComponent, '.csv', 'Filename should have .csv extension');
});

test('Comma handling in text fields', () => {
  assertIncludes(exportComponent, "cellStr.includes(',')",
    'Should check for commas in cells');
  assertIncludes(exportComponent, '`"${cellStr.replace(/"/g, \'""\')}"`',
    'Should wrap cells with commas in quotes');
});

test('Quote escaping is implemented', () => {
  assertIncludes(exportComponent, '/"/g', 'Should check for quotes');
  assertIncludes(exportComponent, '\'""\'', 'Should escape quotes by doubling them');
});

test('Newline handling in text fields', () => {
  assertIncludes(exportComponent, "cellStr.includes('\\n')",
    'Should check for newlines in cells');
});

console.log('\n4. EDGE CASE HANDLING\n');

test('Empty/null values are handled', () => {
  assertIncludes(exportComponent, "c.name || ''", 'Name should have empty string fallback');
  assertIncludes(exportComponent, "c.phone || ''", 'Phone should have empty string fallback');
  assertIncludes(exportComponent, "c.email || ''", 'Email should have empty string fallback');
  assertIncludes(exportComponent, "c.orders || 0", 'Orders should have 0 fallback');
});

test('Optional chaining for nested properties', () => {
  assertIncludes(exportComponent, 'c.rfm?.R', 'RFM.R should use optional chaining');
  assertIncludes(exportComponent, 'c.churnRisk?.level', 'churnRisk.level should use optional chaining');
  assertIncludes(exportComponent, 'c.behavior?.peakDay', 'behavior.peakDay should use optional chaining');
  assertIncludes(exportComponent, 'c.location?.district', 'location.district should use optional chaining');
  assertIncludes(exportComponent, 'c.cohort?.monthly', 'cohort.monthly should use optional chaining');
});

console.log('\n5. REACT BEST PRACTICES\n');

test('Component uses proper React imports', () => {
  assertIncludes(exportComponent, "import React from 'react'",
    'React should be imported');
});

test('Component receives customers prop', () => {
  assertIncludes(exportComponent, 'const CustomerExport = ({ customers })',
    'Component should destructure customers prop');
});

test('Button has onClick handler', () => {
  assertIncludes(exportComponent, 'onClick={exportToCSV}',
    'Button should have onClick handler');
});

test('Button has accessibility attributes', () => {
  assertIncludes(exportComponent, 'title=', 'Button should have title attribute for accessibility');
});

test('Component is exported as default', () => {
  assertIncludes(exportComponent, 'export default CustomerExport',
    'Component should be default export');
});

console.log('\n6. MEMORY MANAGEMENT\n');

test('Blob URL is revoked after download', () => {
  assertIncludes(exportComponent, 'URL.revokeObjectURL',
    'Blob URL should be revoked to prevent memory leaks');
  assertIncludes(exportComponent, 'URL.revokeObjectURL(link.href)',
    'Should revoke the link href');
});

test('Download is triggered programmatically', () => {
  assertIncludes(exportComponent, 'link.click()',
    'Download should be triggered via link.click()');
});

console.log('\n=== TEST SUMMARY ===\n');
console.log(`Total Tests: ${results.total}`);
console.log(`Passed: ${results.passed} ✓`);
console.log(`Failed: ${results.failed} ✗`);
console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\nFailed Tests:');
  results.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.name}: ${t.error}`);
  });
  process.exit(1);
} else {
  console.log('\n✓ All tests passed!');
  process.exit(0);
}
