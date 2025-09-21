import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = today.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return new NextResponse('Missing latitude or longitude', { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return new NextResponse('Internal Server Error: API key missing', { status: 500 });
  }

  try {
    // 1. Get all registered pharmacies from our DB
    const onDutyPharmacies = new Map<string, string>();
    const todayString = getTodayDateString();

    const pharmaciesSnapshot = await adminDb.collection('pharmacies').get();

    for (const pharmacyDoc of pharmaciesSnapshot.docs) {
        const scheduleDocRef = adminDb.collection('pharmacies').doc(pharmacyDoc.id).collection('schedules').doc(todayString);
        const scheduleDoc = await scheduleDocRef.get();

        if (scheduleDoc.exists) {
            const status = scheduleDoc.data()?.status;
            if (status && status !== 'aucune') {
                onDutyPharmacies.set(pharmacyDoc.id, status);
            }
        }
    }

    // 2. Fetch nearby pharmacies from Google Places API
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress,places.id'
      },
      body: JSON.stringify({
        includedTypes: ['pharmacy'],
        locationRestriction: {
          circle: {
            center: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
            },
            radius: 5000.0, // 5 km radius
          },
        },
      }),
    });

    const googleData = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error('Google Places API error:', googleData);
      return new NextResponse(
        JSON.stringify({
          message: "Erreur lors de l'appel à l'API Google Places.",
          googleError: googleData,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Merge Google data with our on-duty data
    const pharmacies = googleData.places?.map((place: { id: string; displayName?: { text: string; }; formattedAddress: string; location?: { latitude: number; longitude: number; }; }) => {
        const onDutyStatus = onDutyPharmacies.get(place.id);
        return {
            id: place.id,
            name: place.displayName?.text,
            address: place.formattedAddress,
            lat: place.location?.latitude,
            lng: place.location?.longitude,
            onDutyStatus: onDutyStatus || 'aucune', // Add our custom status
        }
    }) || [];

    return NextResponse.json(pharmacies);

  } catch (error) {
    console.error('An error occurred in /api/pharmacies:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
