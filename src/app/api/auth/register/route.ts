import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { GeoPoint } from 'firebase-admin/firestore';

// Helper function for Firebase Admin initialization
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return { 
            authAdmin: admin.auth(), 
            firestoreAdmin: admin.firestore() 
        };
    }
    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountJson) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set in environment variables.");
        }
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully for Register route.");
        return { 
            authAdmin: admin.auth(), 
            firestoreAdmin: admin.firestore() 
        };
    } catch (error) {
        console.error("Firebase Admin SDK initialization failed:", error);
        throw new Error("Could not initialize Firebase Admin SDK.");
    }
}

// Helper function to geocode an address using Google Geocoding API
async function geocodeAddress(address: string): Promise<GeoPoint | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Backend API Key
    if (!apiKey) {
        console.error('Google Maps API key is not configured on the backend.');
        return null;
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results[0]) {
            const location = data.results[0].geometry.location;
            return new GeoPoint(location.lat, location.lng);
        } else {
            console.warn(`Geocoding failed for address: ${address}. Status: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error('Error during geocoding fetch:', error);
        return null;
    }
}

export async function POST(request: Request) {
  try {
    const { authAdmin, firestoreAdmin } = initializeFirebaseAdmin();

    const body = await request.json();
    const { email, password, role, ...rest } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userRecord = await authAdmin.createUser({ email, password });
    const { uid } = userRecord;

    try {
      if (role === 'pharmacist') {
        const { name, address, phone } = rest;
        if (!name || !address || !phone) {
          throw new Error('Missing required fields for pharmacist');
        }

        // --- Geocoding Step ---
        const location = await geocodeAddress(address);
        if (!location) {
            // If geocoding fails, we still create the profile but log a warning.
            // A better approach might be to return an error to the user.
            console.warn(`Could not determine coordinates for address: ${address}`);
        }

        const profileData = {
          role: 'pharmacist',
          email,
          name,
          address,
          phone,
          ownerUid: uid,
          location: location, // Add the GeoPoint to the profile
          isOnDuty: false, // Initialize default values
          currentTraffic: 'Faible',
        };
        await firestoreAdmin.collection('pharmacies').doc(uid).set(profileData);

      } else {
        const profileData = { role: 'user', email };
        await firestoreAdmin.collection('users').doc(uid).set(profileData);
      }

      return NextResponse.json({ uid, role }, { status: 201 });

    } catch (firestoreError) {
        await authAdmin.deleteUser(uid);
        throw firestoreError;
    }

  } catch (error) {
    console.error('REGISTRATION_ERROR:', error);
    let errorMessage = 'An unexpected error occurred during registration.';
    let statusCode = 500;

    if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string };
        // Provide more specific error messages for common Firebase admin errors
        if (firebaseError.code === 'auth/email-already-exists') {
          errorMessage = 'This email address is already in use.';
          statusCode = 409; // Conflict
        } else if (firebaseError.code === 'auth/invalid-password') {
          errorMessage = 'The password must be at least 6 characters long.';
          statusCode = 400;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}