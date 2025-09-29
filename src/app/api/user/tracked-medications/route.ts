import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
        } catch (error) {
            // We don't throw here, to allow the function to return a proper error response
        }
    }
    return admin;
}

async function updateUserTrackedMedications(firestoreAdmin: admin.firestore.Firestore, uid: string, medicationId: string, action: 'TRACK' | 'UNTRACK') {
    const userDocRef = firestoreAdmin.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        throw new Error('User not found in Firestore');
    }

    const updateAction = action === 'TRACK' 
        ? FieldValue.arrayUnion(medicationId) 
        : FieldValue.arrayRemove(medicationId);

    await userDocRef.update({
        trackedMedications: updateAction
    });
}

async function handleRequest(request: Request, action: 'TRACK' | 'UNTRACK') {
    try {
        initializeFirebaseAdmin();
        const firestoreAdmin = admin.firestore();
        const authAdmin = admin.auth();
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        let medicationId: string | null;
        if (action === 'TRACK') {
            const { medicationId: bodyMedId } = await request.json();
            medicationId = bodyMedId;
        } else { // UNTRACK
            const { searchParams } = new URL(request.url);
            medicationId = searchParams.get('medicationId');
        }

        if (!medicationId) {
            return new NextResponse('Bad Request: medicationId is required', { status: 400 });
        }

        await updateUserTrackedMedications(firestoreAdmin, uid, medicationId, action);

        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error(`Error in ${action} /api/user/tracked-medications:`, error);
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/id-token-expired') {
            return new NextResponse('Token expired', { status: 401 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    return handleRequest(request, 'TRACK');
}

export async function DELETE(request: Request) {
    return handleRequest(request, 'UNTRACK');
}