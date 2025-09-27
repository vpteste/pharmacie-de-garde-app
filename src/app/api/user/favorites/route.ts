import { NextResponse } from 'next/server';
import { firestoreAdmin, authAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        // 1. Verify User Authentication
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Parse Request Body
        const { pharmacyId } = await request.json();
        if (!pharmacyId) {
            return new NextResponse('Bad Request: pharmacyId is required', { status: 400 });
        }

        // 3. Update Firestore Document
        const userDocRef = firestoreAdmin.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return new NextResponse('User not found in Firestore', { status: 404 });
        }

        const userData = userDoc.data();
        const isFavorite = userData?.favoritePharmacies?.includes(pharmacyId);

        if (isFavorite) {
            // Remove from favorites
            await userDocRef.update({
                favoritePharmacies: FieldValue.arrayRemove(pharmacyId)
            });
        } else {
            // Add to favorites
            await userDocRef.update({
                favoritePharmacies: FieldValue.arrayUnion(pharmacyId)
            });
        }

        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error('Error in /api/user/favorites:', error);
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/id-token-expired') {
            return new NextResponse('Token expired', { status: 401 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
