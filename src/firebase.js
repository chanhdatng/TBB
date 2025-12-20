import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Firebase configuration from environment variables
// This keeps sensitive data out of the source code
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that all required environment variables are present
const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_DATABASE_URL',
    'VITE_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const database = getDatabase(app);
export const auth = getAuth(app);

// Helper functions for Realtime Database references
export const getEmployeesRef = () => getRef('employees');
export const getUsersRef = () => getRef('users');
export const getDepartmentsRef = () => getRef('departments');
export const getAttendanceRef = () => getRef('attendance');
export const getPerformanceReviewsRef = () => getRef('performanceReviews');

// Enhanced employee onboarding references
export const getDocumentsRef = () => getRef('documents');
export const getEmployeeUpdatesRef = () => getRef('employeeUpdates');
export const getOnboardingTasksRef = () => getRef('onboardingTasks');
export const getDocumentTemplatesRef = () => getRef('documentTemplates');

// Helper functions for specific document references
export const getEmployeeDocumentsRef = (employeeId) => getRef(`employees/${employeeId}/documents`);
export const getEmployeeEmergencyContactsRef = (employeeId) => getRef(`employees/${employeeId}/emergencyContacts`);
export const getEmployeeBankingInfoRef = (employeeId) => getRef(`employees/${employeeId}/bankingInfo`);
export const getEmployeeTaxInfoRef = (employeeId) => getRef(`employees/${employeeId}/taxInfo`);
export const getEmployeeOnboardingRef = (employeeId) => getRef(`employees/${employeeId}/onboarding`);

// Generic ref helper
function getRef(path) {
    return { path };
}
