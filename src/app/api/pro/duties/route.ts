import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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
    if (!authorization?.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED');
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'pharmacist') {
        throw new Error('FORBIDDEN_NOT_PHARMACIST');
    }
    const pharmacyId = userDoc.data()?.pharmacyId;
    if (!pharmacyId) {
        throw new Error('FORBIDDEN_NO_PHARMACY');
    }
    return pharmacyId;
}

// POST handler for creating a new duty
export async function POST(request: Request) {
    try {
        initializeFirebaseAdmin();
        const authAdmin = admin.auth();
        const firestoreAdmin = admin.firestore();

        const pharmacyId = await authenticatePharmacist(request, authAdmin, firestoreAdmin);
        const { start, end } = await request.json();

        if (!start || !end) {
            return new NextResponse('Bad Request: Missing start or end time', { status: 400 });
        }

        const dutiesRef = firestoreAdmin.collection('pharmacies').doc(pharmacyId).collection('duties');
        const newDuty = {
            start: Timestamp.fromDate(new Date(start)),
            end: Timestamp.fromDate(new Date(end)),
        };

        const docRef = await dutiesRef.add(newDuty);

        return NextResponse.json({ success: true, id: docRef.id, ...newDuty });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'UNAUTHORIZED') return new NextResponse('Unauthorized', { status: 401 });
            if (error.message.startsWith('FORBIDDEN')) return new NextResponse('Forbidden', { status: 403 });
        }
        console.error('Error in POST /api/pro/duties:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// DELETE handler for deleting a duty
export async function DELETE(request: Request) {
    try {
        initializeFirebaseAdmin();
        const authAdmin = admin.auth();
        const firestoreAdmin = admin.firestore();

        const pharmacyId = await authenticatePharmacist(request, authAdmin, firestoreAdmin);
        const { searchParams } = new URL(request.url);
        const dutyId = searchParams.get('dutyId');

        if (!dutyId) {
            return new NextResponse('Bad Request: dutyId is required', { status: 400 });
        }

        const dutyRef = firestoreAdmin.collection('pharmacies').doc(pharmacyId).collection('duties').doc(dutyId);
        
        const doc = await dutyRef.get();
        if (!doc.exists) {
            return new NextResponse('Not Found', { status: 404 });
        }

        await dutyRef.delete();

        return NextResponse.json({ success: true, message: `Duty ${dutyId} deleted.` });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'UNAUTHORIZED') return new NextResponse('Unauthorized', { status: 401 });
            if (error.message.startsWith('FORBIDDEN')) return new NextResponse('Forbidden', { status: 403 });
        }
        console.error('Error in DELETE /api/pro/duties:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}