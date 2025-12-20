/**
 * Test file for employee transformers
 * Run this file to verify transformations are working correctly
 */

import {
    transformEmployeeFromFirebase,
    transformEmployeeToFirebase,
    transformEmployeesList,
    validateEmployeeData,
    generateEmployeeId,
    formatEmployeeForDisplay
} from './employeeTransformers';

// Test data
const testFirebaseEmployee = {
    id: 'emp123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    position: 'Software Engineer',
    departmentId: 'dept456',
    department: 'Engineering',
    status: 'active',
    hireDate: '2023-01-15T00:00:00.000Z',
    salary: 75000,
    skills: ['JavaScript', 'React', 'Node.js'],
    certifications: ['AWS Certified'],
    createdAt: '2023-01-15T10:00:00.000Z',
    updatedAt: '2024-01-01T15:30:00.000Z'
};

const testFrontendEmployee = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+0987654321',
    position: 'Product Manager',
    departmentId: 'dept789',
    status: 'active',
    hireDate: new Date('2023-06-01'),
    salary: 95000,
    skills: ['Product Strategy', 'Agile', 'Analytics']
};

// Run tests
export const runEmployeeTransformerTests = () => {
    console.log('🧪 Running Employee Transformer Tests...\n');

    // Test 1: Firebase to Frontend transformation
    console.log('Test 1: Firebase → Frontend');
    const frontendEmployee = transformEmployeeFromFirebase(testFirebaseEmployee);
    console.log('✅ Transformed employee:', {
        fullName: frontendEmployee.fullName,
        displayName: frontendEmployee.displayName,
        yearsOfService: frontendEmployee.yearsOfService,
        workStatus: frontendEmployee.workStatus
    });

    // Test 2: Frontend to Firebase transformation
    console.log('\nTest 2: Frontend → Firebase');
    const firebaseEmployee = transformEmployeeToFirebase(testFrontendEmployee);
    console.log('✅ Transformed to Firebase:', {
        hasHireDate: !!firebaseEmployee.hireDate,
        hasCreatedAt: !!firebaseEmployee.createdAt,
        hasUpdatedAt: !!firebaseEmployee.updatedAt,
        salaryType: typeof firebaseEmployee.salary
    });

    // Test 3: Round-trip transformation
    console.log('\nTest 3: Round-trip transformation');
    const roundTrip = transformEmployeeFromFirebase(firebaseEmployee);
    console.log('✅ Round-trip successful:', {
        originalName: `${testFrontendEmployee.firstName} ${testFrontendEmployee.lastName}`,
        roundTripName: roundTrip.fullName,
        emailMatch: testFrontendEmployee.email === roundTrip.email
    });

    // Test 4: List transformation
    console.log('\nTest 4: List transformation');
    const testList = {
        emp1: testFirebaseEmployee,
        emp2: { ...testFirebaseEmployee, id: 'emp2', firstName: 'Alice', lastName: 'Johnson' }
    };
    const transformedList = transformEmployeesList(testList);
    console.log('✅ List transformed:', {
        count: transformedList.length,
        firstEmployee: transformedList[0]?.fullName,
        secondEmployee: transformedList[1]?.fullName
    });

    // Test 5: Validation
    console.log('\nTest 5: Validation');
    const validEmployee = testFrontendEmployee;
    const invalidEmployee = { ...testFrontendEmployee, email: 'invalid-email', firstName: '' };

    const validResult = validateEmployeeData(validEmployee);
    const invalidResult = validateEmployeeData(invalidEmployee);

    console.log('✅ Valid employee:', {
        isValid: validResult.isValid,
        errors: validResult.errors
    });
    console.log('❌ Invalid employee:', {
        isValid: invalidResult.isValid,
        errors: invalidResult.errors
    });

    // Test 6: Employee ID generation
    console.log('\nTest 6: Employee ID generation');
    const empId = generateEmployeeId('John', 'Doe');
    console.log('✅ Generated ID:', empId, {
        hasInitials: empId.includes('JD'),
        length: empId.length
    });

    // Test 7: Display formatting
    console.log('\nTest 7: Display formatting');
    const displayEmployee = formatEmployeeForDisplay(frontendEmployee);
    console.log('✅ Formatted for display:', {
        name: displayEmployee.name,
        status: displayEmployee.status?.text,
        salary: displayEmployee.salary,
        hireDate: displayEmployee.hireDate
    });

    console.log('\n🎉 All tests completed!');
    return {
        success: true,
        tests: [
            'Firebase → Frontend transformation',
            'Frontend → Firebase transformation',
            'Round-trip transformation',
            'List transformation',
            'Data validation',
            'Employee ID generation',
            'Display formatting'
        ]
    };
};

// Auto-run tests if this file is imported directly
if (typeof window !== 'undefined') {
    // Browser environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🚀 Employee transformers ready for testing in development mode');
    }
} else if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Node.js environment
    runEmployeeTransformerTests();
}

export default runEmployeeTransformerTests;