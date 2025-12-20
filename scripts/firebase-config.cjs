require('dotenv').config({ path: '../backend/.env' });
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/**
 * Initialize Firebase Admin SDK
 * Supports two methods:
 * 1. Service Account Key file (backend/serviceAccountKey.json)
 * 2. Environment variables (backend/.env)
 */
function initializeFirebase() {
  // Method 1: Try service account key file
  const serviceAccountPath = path.join(__dirname, '../backend/serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log('🔑 Using service account key file...');
    const serviceAccount = require(serviceAccountPath);

    // Construct databaseURL from project_id if not provided
    // Using Asia Southeast region for better performance
    const databaseURL = process.env.FIREBASE_DATABASE_URL ||
                       serviceAccount.databaseURL ||
                       `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL
    });

    console.log('✅ Firebase Admin initialized with service account key');
    console.log(`📍 Database URL: ${databaseURL}`);
    return admin.database();
  }

  // Method 2: Try environment variables
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('🔑 Using environment variables...');

    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log('✅ Firebase Admin initialized with environment variables');
    return admin.database();
  }

  // No credentials found
  console.error('\n❌ Firebase credentials not found!');
  console.error('\nPlease set up one of the following:');
  console.error('1. Place serviceAccountKey.json in backend/ directory');
  console.error('2. Add Firebase credentials to backend/.env:');
  console.error('   - FIREBASE_PROJECT_ID');
  console.error('   - FIREBASE_PRIVATE_KEY');
  console.error('   - FIREBASE_CLIENT_EMAIL');
  console.error('   - FIREBASE_DATABASE_URL');
  process.exit(1);
}

module.exports = {
  initializeFirebase,
  admin
};
