import { NextResponse } from 'next/server';
import { authAdmin, firestoreAdmin } from '@/lib/firebase-admin';
import { GeoPoint } from 'firebase-admin/firestore';

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
    if (!authAdmin || !firestoreAdmin) {
      throw new Error('Firebase Admin SDK is not available.');
    }

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

    } catch (firestoreError: any) {
        await authAdmin.deleteUser(uid);
        throw firestoreError;
    }

  } catch (error: any) {
    console.error('REGISTRATION_ERROR:', error);
    let errorMessage = error.message || 'An unexpected error occurred.';
    let statusCode = 500;

    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email address is already in use.';
      statusCode = 409;
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'The password must be at least 6 characters long.';
      statusCode = 400;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}