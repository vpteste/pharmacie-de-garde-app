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
            // Initialization error is handled by the caller
        }
    }
    return admin;
}

// Helper function to authenticate and get pharmacyId
async function authenticatePharmacist(request: Request, authAdmin: admin.auth.Auth, firestoreAdmin: admin.firestore.Firestore): Promise<string> {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
    
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userDoc.exists || userData?.role !== 'pharmacist') throw new Error('FORBIDDEN_NOT_PHARMACIST');
    if (!userData?.pharmacyId) throw new Error('FORBIDDEN_NO_PHARMACY');
    
    return userData.pharmacyId;
}

// GET handler to fetch opening hours
export async function GET(request: Request) {
    try {
        initializeFirebaseAdmin();
        const authAdmin = admin.auth();
        const firestoreAdmin = admin.firestore();
        const pharmacyId = await authenticatePharmacist(request, authAdmin, firestoreAdmin);
        const pharmacyRef = firestoreAdmin.collection('pharmacies').doc(pharmacyId);
        const docSnap = await pharmacyRef.get();

        if (!docSnap.exists) {
            return new NextResponse('Pharmacy not found', { status: 404 });
        }

        const openingHours = docSnap.data()?.openingHours || {};
        return NextResponse.json({ openingHours });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message.startsWith('UNAUTHORIZED')) return new NextResponse('Unauthorized', { status: 401 });
            if (error.message.startsWith('FORBIDDEN')) return new NextResponse('Forbidden', { status: 403 });
        }
        console.error('Error in GET /api/pro/opening-hours:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// POST handler to save opening hours
export async function POST(request: Request) {
    try {
        initializeFirebaseAdmin();
        const authAdmin = admin.auth();
        const firestoreAdmin = admin.firestore();
        const pharmacyId = await authenticatePharmacist(request, authAdmin, firestoreAdmin);
        const hours = await request.json();

        if (!hours || typeof hours !== 'object') {
            return new NextResponse('Bad Request: Invalid hours data', { status: 400 });
        }

        const pharmacyRef = firestoreAdmin.collection('pharmacies').doc(pharmacyId);
        await pharmacyRef.update({ openingHours: hours });

        return NextResponse.json({ success: true, message: 'Opening hours updated successfully.' });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message.startsWith('UNAUTHORIZED')) return new NextResponse('Unauthorized', { status: 401 });
            if (error.message.startsWith('FORBIDDEN')) return new NextResponse('Forbidden', { status: 403 });
        }
        console.error('Error in POST /api/pro/opening-hours:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}