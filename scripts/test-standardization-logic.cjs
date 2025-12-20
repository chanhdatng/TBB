// Test standardization logic

const shouldStandardizeToBrazilianCheesebread = (name) => {
    const normalized = name.trim().toLowerCase();

    const exactMatches = [
        'brazilian cheese bread',
        'brazilian cheesebread',
        'cheese bread',
        'cheesebread',
        'brazillian cheesebread', // common typo
        'cheesebreead', // typo
        'pão de queijo'
    ];

    return exactMatches.includes(normalized);
};

// Test cases from the scan
const testCases = [
    { input: 'brazilian cheese bread ', expected: true },
    { input: 'Brazilian cheese bread ', expected: true },
    { input: 'Cheesebread', expected: true },
    { input: 'Brazilian Cheese Bread ', expected: true },
    { input: 'Brazillian Cheesebread', expected: true },
    { input: 'Cheesebreead', expected: true },
    { input: 'cheese bread ', expected: true },
    { input: 'Brazilian Cheesebread', expected: false }, // Already correct
    { input: 'Chà Bông cheese bread', expected: false }, // Different product
    { input: 'Banana Cheese Oat', expected: false }, // Different product
    { input: 'Double cheese burn', expected: false }, // Different product
];

console.log('Testing standardization logic:\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
    const result = shouldStandardizeToBrazilianCheesebread(input);
    const trimmed = input.trim();
    const shouldFix = result && trimmed !== 'Brazilian Cheesebread';
    const status = shouldFix === expected ? '✓ PASS' : '✗ FAIL';

    if (shouldFix === expected) {
        passed++;
    } else {
        failed++;
    }

    console.log(`${status} | "${input}" -> Should fix: ${shouldFix} (Expected: ${expected})`);
});

console.log('='.repeat(80));
console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('✓ All tests passed!\n');
} else {
    console.log('✗ Some tests failed!\n');
    process.exit(1);
}
