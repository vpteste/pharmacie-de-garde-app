import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId, name, address } = body;

    if (!placeId) {
      return new NextResponse('Missing placeId', { status: 400 });
    }

    // Pour l'instant, on affiche simplement le signalement dans la console du serveur.
    // Une future amélioration serait de stocker cela dans une base de données (Firebase, etc.)
    console.log(`[USER FEEDBACK] Error reported for pharmacy:
  - Place ID: ${placeId}
  - Name: ${name}
  - Address: ${address}
  - Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({ message: 'Report received successfully' }, { status: 200 });

  } catch (error) {
    console.error('[API report-error] An error occurred:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
