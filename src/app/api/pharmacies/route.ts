import { NextResponse, NextRequest } from 'next/server';
import admin from 'firebase-admin';

// Helper function for Firebase Admin initialization
function initializeFirebaseAdmin() {
    if (admin.apps.length === 0) {
        try {
            const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            if (!serviceAccountJson) {
                throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set in environment variables.");
            }
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (error) {
            console.error("Firebase Admin SDK initialization failed:", error);
            // We don't throw here, to allow the function to return a proper error response
        }
    }
    return admin;
}

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function GET(request: NextRequest) {
  console.log("--- New GET request to /api/pharmacies ---");
  try {
    initializeFirebaseAdmin();
    const firestoreAdmin = admin.firestore();
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    console.log(`Query Params: lat=${lat}, lng=${lng}, radius=${radius}`);

    const pharmaciesSnapshot = await firestoreAdmin.collection('pharmacies').get();

    if (pharmaciesSnapshot.empty) {
      console.log("Firestore 'pharmacies' collection is empty.");
      return NextResponse.json({ pharmacies: [] });
    }

    let allPharmacies = pharmaciesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        location: data.location,
        isOnDuty: data.isOnDuty || false,
        openingHours: data.openingHours || null,
      };
    });
    console.log(`Fetched ${allPharmacies.length} total pharmacies from Firestore.`);

    // If location parameters are provided, filter the pharmacies
    if (lat && lng && radius) {
        const centerLat = parseFloat(lat);
        const centerLng = parseFloat(lng);
        const searchRadiusKm = parseFloat(radius) / 1000;

        const filteredPharmacies = allPharmacies.filter(pharmacy => {
            if (pharmacy.location && pharmacy.location._latitude && pharmacy.location._longitude) {
                const distance = haversineDistance(
                    centerLat, centerLng,
                    pharmacy.location._latitude,
                    pharmacy.location._longitude
                );
                return distance <= searchRadiusKm;
            }
            return false;
        });
        console.log(`Filtered pharmacies: ${filteredPharmacies.length} found within ${searchRadiusKm}km.`);
        return NextResponse.json({ pharmacies: filteredPharmacies });
    } else {
        console.log("No location params, returning all pharmacies.");
        return NextResponse.json({ pharmacies: allPharmacies });
    }

  } catch (error) {
    console.error("Error in /api/pharmacies: ", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}