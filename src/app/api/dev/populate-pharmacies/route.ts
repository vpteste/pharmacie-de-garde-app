import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import admin from 'firebase-admin';
import { GeoPoint } from 'firebase-admin/firestore';

// Helper function for Firebase Admin initialization
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return;
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
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
        console.error("Firebase Admin SDK initialization failed:", error);
        throw new Error("Could not initialize Firebase Admin SDK.");
    }
}

// --- Logique du Script (adaptée pour une Route API) ---

async function runPopulationScript() {
    initializeFirebaseAdmin();
    const firestoreAdmin = admin.firestore();

    const BASE_URL = 'https://www.pharmacies-de-garde.ci';

    interface PharmacyData {
        commune: string;
        name: string;
        phone: string;
        fullText: string;
        address: string;
    }

    interface GeocodeResponse {
        status: string;
        results: {
            geometry: {
                location: { lat: number; lng: number; }
            }
        }[];
    }

    // 1. Réinitialiser le statut de garde
    console.log('Réinitialisation du statut de garde pour les pharmacies existantes...');
    const pharmaciesCollection = firestoreAdmin.collection('pharmacies');
    const snapshot = await pharmaciesCollection.get();
    if (!snapshot.empty) {
        const resetBatch = firestoreAdmin.batch();
        snapshot.docs.forEach(doc => { resetBatch.update(doc.ref, { isOnDuty: false }); });
        await resetBatch.commit();
        console.log(`${snapshot.size} pharmacies mises à jour.`);
    }

    // 2. Scraper les nouvelles données
    console.log(`Fetching latest article URL from ${BASE_URL}...`);
    const response = await fetch(BASE_URL);
    if (!response.ok) { throw new Error(`Failed to fetch base URL: ${response.statusText}`); }
    const html = await response.text();
    const $ = cheerio.load(html);
    const articleLink = $('a[href*="pharmacies-de-garde-a-abidjan-du-"]').first();
    if (articleLink.length === 0) { throw new Error("Could not find the link for today's on-duty pharmacies."); }
    const articleUrl = articleLink.attr('href');
    if (!articleUrl) { throw new Error("Found link element but it has no href."); }
    console.log(`Found article URL: ${articleUrl}`);

    const scrapeResponse = await fetch(articleUrl);
    if (!scrapeResponse.ok) { throw new Error(`Failed to fetch page: ${scrapeResponse.statusText}`); }
    const scrapeHtml = await scrapeResponse.text();
    const $$ = cheerio.load(scrapeHtml);
    const pharmaciesData: PharmacyData[] = [];
    const content = $$('.td-post-content');

    content.find('h2').each((i, h2) => {
        const commune = $$(h2).text().trim();
        if (!commune || commune.toUpperCase().includes('CONTACT')) return;
        let currentNode = $$(h2).next();
        while (currentNode.length > 0 && currentNode.prop('tagName') !== 'H2') {
            if (currentNode.prop('tagName') === 'P') {
                const pharmacyText = currentNode.text().trim().replace(/\s+/g, ' ');
                const nameMatch = pharmacyText.match(/^(PHARMACIE[^:-]+)/i);
                const phoneMatch = pharmacyText.match(/(Tél|Tel|TEL)[\s:.]*([\d\s/]+)/);
                const name = nameMatch ? nameMatch[0].trim() : null;
                if (name) {
                    const phone = phoneMatch && phoneMatch[2] ? phoneMatch[2].trim() : '';
                    let address = pharmacyText.replace(name, '');
                    if (phoneMatch && phoneMatch[0]) { address = address.replace(phoneMatch[0], ''); }
                    address = address.replace(/-\s*(M\.|Mme|Monsieur)\s+.*$/, '').trim();
                    address = address.replace(/^[\s,-–]+|[\s,-–]+$/g, '').trim();
                    pharmaciesData.push({ commune, name, phone, fullText: pharmacyText, address: `${address}, ${commune}, Côte d'Ivoire` });
                }
            }
            currentNode = currentNode.next();
        }
    });
    console.log(`${pharmaciesData.length} pharmacies scrapées.`);

    if (pharmaciesData.length === 0) {
        return { success: true, message: "No pharmacies were scraped, but the process finished." };
    }

    // 3. Géocoder et sauvegarder
    console.log(`Starting Firestore batch write for ${pharmaciesData.length} pharmacies...`);
    const batch = firestoreAdmin.batch();
    const collectionRef = firestoreAdmin.collection('pharmacies');
    let geocodedCount = 0;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    for (const pharmacy of pharmaciesData) {
        const docId = pharmacy.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        const docRef = collectionRef.doc(docId);
        let location: GeoPoint | null = null;

        if (apiKey) {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pharmacy.address)}&key=${apiKey}`;
            try {
                const geoResponse = await fetch(url);
                const data = await geoResponse.json() as GeocodeResponse;
                if (data.status === 'OK' && data.results[0]) {
                    const geoLoc = data.results[0].geometry.location;
                    location = new GeoPoint(geoLoc.lat, geoLoc.lng);
                    geocodedCount++;
                }
            } catch (error) { console.error(`Geocoding error for ${pharmacy.address}:`, error); }
        }

        const finalDoc = { name: pharmacy.name, address: pharmacy.address, phone: pharmacy.phone, commune: pharmacy.commune, location: location, isOnDuty: true, lastDutyDate: new Date() };
        batch.set(docRef, finalDoc, { merge: true });
    }
    
    await batch.commit();
    console.log(`Batch write complete. ${geocodedCount} / ${pharmaciesData.length} geocoded.`);
    return { success: true, message: `${pharmaciesData.length} pharmacies processed.` };
}

export async function GET() {
  console.log("\n--- VERCEL POPULATE API TRIGGERED ---");
  try {
    const result = await runPopulationScript();
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("\n--- A critical error occurred during Vercel API route execution: ---");
    if (error instanceof Error) {
        return NextResponse.json({ success: false, message: error.message, stack: error.stack }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: "An unknown error occurred" }, { status: 500 });
  }
}