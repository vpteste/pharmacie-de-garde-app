import { NextResponse, NextRequest } from 'next/server';

// Variables globales pour le cache
let cachedPharmacies: any[] | null = null;
let lastFetchTime: Date | null = null;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return new NextResponse('Missing latitude or longitude', { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API key is missing.');
    return new NextResponse('Internal Server Error: API key missing', { status: 500 });
  }

  const now = new Date();
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  // Vérifier si le cache est valide (mis à jour aujourd'hui après midi)
  if (cachedPharmacies && lastFetchTime && lastFetchTime > todayNoon) {
    console.log('Serving pharmacies from cache.');
    return NextResponse.json(cachedPharmacies);
  }

  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  try {
    const response = await fetch(url, {
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

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      return new NextResponse(`Google Places API error: ${data.message || response.statusText}`, { status: response.status });
    }

    const pharmacies = data.places.map((place: any) => ({
      id: place.id,
      name: place.displayName?.text,
      address: place.formattedAddress,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
    }));

    // Mettre à jour le cache
    cachedPharmacies = pharmacies;
    lastFetchTime = now;

    return NextResponse.json(pharmacies);

  } catch (error) {
    console.error('An error occurred during the Google Places API request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
