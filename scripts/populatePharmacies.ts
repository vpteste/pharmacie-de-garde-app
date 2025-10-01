import admin from 'firebase-admin';
import { GeoPoint } from 'firebase-admin/firestore';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env.local à la racine du projet
dotenv.config({ path: '.env.local' });

/**
 * Initialise l'application Firebase Admin.
 * Charge les identifiants depuis un fichier `serviceAccountKey.json` qui doit se trouver à la racine du projet.
 */
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require('../serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error("ERROR: Could not find 'serviceAccountKey.json'.");
            console.error("Please download it from your Firebase project settings and place it in the project root directory.");
            process.exit(1);
        }
        console.error("Firebase Admin SDK initialization failed:", error);
        throw new Error("Could not initialize Firebase Admin SDK.");
    }
}

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

async function runPopulationScript() {
    initializeFirebaseAdmin();
    const firestoreAdmin = admin.firestore();

    const BASE_URL = 'https://www.phonerol.com/pharmacie-de-garde-abidjan-cote-divoire';

    // 1. Réinitialiser le statut de garde
    console.log('Réinitialisation du statut de garde pour les pharmacies existantes...');
    const pharmaciesCollection = firestoreAdmin.collection('pharmacies');
    const snapshot = await pharmaciesCollection.get();
    if (!snapshot.empty) {
        const resetBatch = firestoreAdmin.batch();
        snapshot.docs.forEach(doc => { resetBatch.update(doc.ref, { isOnDuty: false }); });
        await resetBatch.commit();
        console.log(`${snapshot.size} pharmacies mises à jour (isOnDuty: false).`);
    }

    // 2. Scraper les nouvelles données depuis Phonerol.com
    console.log(`Fetching data from ${BASE_URL}...`);
    const response = await fetch(BASE_URL);
    if (!response.ok) { throw new Error(`Failed to fetch base URL: ${response.statusText}`); }
    const html = await response.text();
    const $ = cheerio.load(html);
    const pharmaciesData: PharmacyData[] = [];

    const content = $('.entry');

    content.find('h2').each((i, h2) => {
        const h2Text = $(h2).text().trim();
        if (h2Text.toLowerCase().includes('pharmacie de garde abidjan')) {
            const commune = $(h2).find('strong').text().trim();
            if (!commune) return; // Skip if it's not a proper commune header

            let currentElement = $(h2).next();
            while (currentElement.length > 0 && !currentElement.is('h2')) {
                if (currentElement.is('p')) {
                    const p_html = currentElement.html();
                    if (p_html) {
                                        const lines = p_html.split('<br>').map(line => $(`<span>${line}</span>`).text().trim()).filter(Boolean);

                        if (lines.length > 0 && lines[0].toUpperCase().includes('PHARMACIE')) {
                            const name = lines[0];
                            let phone = '';
                            let address = '';

                            lines.forEach(line => {
                                if (line.includes('📞')) {
                                    phone = line.replace(/📞/g, '').trim();
                                }
                                if (line.includes('📍')) {
                                    address = line.replace(/📍/g, '').trim();
                                }
                            });

                            if (name) {
                                pharmaciesData.push({
                                    commune: commune,
                                    name: name,
                                    phone: phone,
                                    address: address ? `${address}, ${commune}, Côte d'Ivoire` : `${commune}, Côte d'Ivoire`,
                                    fullText: lines.join(', ')
                                });
                            }
                        }
                    }
                }
                currentElement = currentElement.next();
            }
        }
    });

    console.log(`${pharmaciesData.length} pharmacies scrapées.`);

    if (pharmaciesData.length === 0) {
        throw new Error("No pharmacies were scraped from Phonerol. The site structure may have changed. Check temp_phonerol.html.");
    }

    // 3. Géocoder et sauvegarder
    console.log(`Starting Firestore batch write for ${pharmaciesData.length} pharmacies...`);
    const batch = firestoreAdmin.batch();
    const collectionRef = firestoreAdmin.collection('pharmacies');
    let geocodedCount = 0;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.warn("WARNING: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Pharmacies will not be geocoded.");
    }

    for (const pharmacy of pharmaciesData) {
        const docId = pharmacy.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        const docRef = collectionRef.doc(docId);
        let location: GeoPoint | null = null;

        if (apiKey) {
            // Add a delay to avoid hitting API rate limits
            await new Promise(resolve => setTimeout(resolve, 200));

            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pharmacy.address)}&key=${apiKey}`;
            try {
                const geoResponse = await fetch(url);
                const data = await geoResponse.json() as GeocodeResponse;
                if (data.status === 'OK' && data.results[0]) {
                    const geoLoc = data.results[0].geometry.location;
                    location = new GeoPoint(geoLoc.lat, geoLoc.lng);
                    geocodedCount++;
                } else {
                    console.warn(`Geocoding failed for ${pharmacy.address}: ${data.status}`);
                }
            } catch (error: any) { console.error(`Geocoding error for ${pharmacy.address}:`, error); }
        }

        const finalDoc = { 
            name: pharmacy.name, 
            address: pharmacy.address, 
            phone: pharmacy.phone, 
            commune: pharmacy.commune, 
            location: location, 
            isOnDuty: true, 
            lastDutyDate: new Date() 
        };
        batch.set(docRef, finalDoc, { merge: true });
    }
    
    await batch.commit();
    console.log(`Batch write complete. ${geocodedCount} / ${pharmaciesData.length} geocoded.`);
    return { success: true, message: `${pharmaciesData.length} pharmacies processed.` };
}

runPopulationScript()
    .then(result => {
        console.log('\n----------------------------------------');
        console.log('✅ Script finished successfully.');
        console.log(`✅ ${result.message}`);
        console.log('----------------------------------------');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n----------------------------------------');
        console.error('❌ Script failed with a critical error:');
        console.error(error);
        console.error('----------------------------------------');
        process.exit(1);
    });
