import admin from 'firebase-admin';

// This file is for server-side use only.

/**
 * =============================================================================
 * IMPORTANT: Firebase Admin SDK Initialization
 * =============================================================================
 * 
 * To use this file, you need to:
 * 1. Go to your Firebase project settings -> Service accounts.
 * 2. Generate a new private key and download the JSON file.
 * 3. DO NOT commit this file to your repository.
 * 4. Set the content of this JSON file as an environment variable named 
 *    `FIREBASE_SERVICE_ACCOUNT_JSON` in your deployment environment (e.g., Vercel).
 * 
 * The JSON content should be a single line string. You can use an online tool
 * to convert your multi-line JSON into a single line.
 * 
 * Example for .env.local:
 * FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ...}'
 * 
 * =============================================================================
 */

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountString) {
      throw new Error('The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // We throw an error to make it clear that the server-side functions 
    // depending on this will not work without proper configuration.
    throw new Error('Firebase Admin SDK failed to initialize. Check your FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
  }
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };
