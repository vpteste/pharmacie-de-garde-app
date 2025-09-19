import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return new NextResponse('Missing placeId', { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API key is missing.');
    return new NextResponse('Internal Server Error: API key missing', { status: 500 });
  }

  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,location,formattedAddress,id,internationalPhoneNumber,businessStatus'
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      return new NextResponse(`Google Places API error: ${data.message || response.statusText}`, { status: response.status });
    }

    const place = data;

    const pharmacyDetails = {
      id: place.id,
      name: place.displayName?.text,
      address: place.formattedAddress,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      status: place.businessStatus ? (place.businessStatus === 'OPERATIONAL' ? 'Ouvert' : 'Fermé') : 'Non disponible',
      phone_number: place.internationalPhoneNumber || 'Non disponible',
    };

    return NextResponse.json(pharmacyDetails);

  } catch (error) {
    console.error('An error occurred during the Google Places API request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
