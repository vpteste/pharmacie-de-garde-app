import { NextResponse } from 'next/server';
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
        } catch {
            // Error during initialization is handled by the caller
        }
    }
    return admin;
}

async function getTrackedMedications(firestoreAdmin: admin.firestore.Firestore, uid: string): Promise<string[]> {
    try {
        const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
        if (!userDoc.exists) return [];
        return userDoc.data()?.trackedMedications || [];
    } catch {
        console.error('Error fetching tracked medications');
        return [];
    }
}

async function getMedicationAvailability(firestoreAdmin: admin.firestore.Firestore, medicationIds: string[]) {
    if (medicationIds.length === 0) return [];
    try {
        const inventorySnapshot = await firestoreAdmin.collectionGroup('inventory')
            .where('stock', '>', 0)
            .get();

        const availabilityMap = new Map<string, number>();

        inventorySnapshot.docs.forEach(doc => {
            const medicationId = doc.id;
            if (medicationIds.includes(medicationId)) {
                availabilityMap.set(medicationId, (availabilityMap.get(medicationId) || 0) + 1);
            }
        });

        return Array.from(availabilityMap.entries()).map(([medicationId, pharmacyCount]) => ({ medicationId, pharmacyCount }));

    } catch {
        console.error('Error fetching medication availability');
        return [];
    }
}

export async function GET(request: Request) {
    try {
        initializeFirebaseAdmin();
        const authAdmin = admin.auth();
        const firestoreAdmin = admin.firestore();
        
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const trackedMedicationIds = await getTrackedMedications(firestoreAdmin, uid);
        const availability = await getMedicationAvailability(firestoreAdmin, trackedMedicationIds);

        return NextResponse.json({ availability });

    } catch {
        console.error('Error in GET /api/medications/status');
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}