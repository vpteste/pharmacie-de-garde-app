import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const pharmaciesSnapshot = await firestoreAdmin.collection('pharmacies').get();

    if (pharmaciesSnapshot.empty) {
      return NextResponse.json({ pharmacies: [] });
    }

    const pharmacies = pharmaciesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        location: data.location, // Assuming a GeoPoint field named 'location' exists
        isOnDuty: data.isOnDuty || false,
        currentTraffic: data.currentTraffic || 'Faible', // Default to 'Faible' if not set
        openingHours: data.openingHours || null, // Include opening hours
      };
    });

    return NextResponse.json({ pharmacies });

  } catch (error) {
    console.error("Error fetching pharmacies: ", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}