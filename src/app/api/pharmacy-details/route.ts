import { NextResponse } from 'next/server';

// This route fetches details for multiple pharmacies from the Google Places API.
// It's designed to be called by our own frontend to avoid exposing the API key for place details lookups.

export async function POST(request: Request) {
    try {
        const { placeIds } = await request.json();

        if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
            return new NextResponse('Bad Request: placeIds array is required', { status: 400 });
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            throw new Error("Google Maps API key is not configured on the server.");
        }

        const detailPromises = placeIds.map(placeId => {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,vicinity,place_id,formatted_phone_number&key=${apiKey}`;
            return fetch(url).then(res => res.json());
        });

        const detailResults = await Promise.all(detailPromises);

        const pharmacies = detailResults.map(result => {
            if (result.status === 'OK') {
                return result.result;
            }
            // Log the error for the specific placeId but don't fail the whole request
            console.warn(`Failed to fetch details for a placeId:`, result);
            return null;
        }).filter(p => p !== null); // Filter out any failed requests

        return NextResponse.json({ pharmacies });

    } catch (error) {
        console.error('Error in /api/pharmacy-details:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
