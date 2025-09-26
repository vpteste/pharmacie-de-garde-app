import { NextResponse } from 'next/server';
import { firestoreAdmin, authAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

async function updateUserTrackedMedications(uid: string, medicationId: string, action: 'TRACK' | 'UNTRACK') {
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

export async function POST(request: Request) {
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const { medicationId } = await request.json();
        if (!medicationId) {
            return new NextResponse('Bad Request: medicationId is required', { status: 400 });
        }

        await updateUserTrackedMedications(uid, medicationId, 'TRACK');

        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error('Error in POST /api/user/tracked-medications:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const { searchParams } = new URL(request.url);
        const medicationId = searchParams.get('medicationId');
        if (!medicationId) {
            return new NextResponse('Bad Request: medicationId is required', { status: 400 });
        }

        await updateUserTrackedMedications(uid, medicationId, 'UNTRACK');

        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error('Error in DELETE /api/user/tracked-medications:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
