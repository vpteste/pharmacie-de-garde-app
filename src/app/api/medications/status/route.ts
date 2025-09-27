import { NextResponse } from 'next/server';
import { authAdmin, firestoreAdmin } from '@/lib/firebase-admin';

async function getTrackedMedications(uid: string): Promise<string[]> {
    try {
        const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
        if (!userDoc.exists) return [];
        return userDoc.data()?.trackedMedications || [];
    } catch (error) {
        console.error('Error fetching tracked medications:', error);
        return [];
    }
}

async function getMedicationAvailability(medicationIds: string[]) {
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

    } catch (error) {
        console.error('Error fetching medication availability:', error);
        return [];
    }
}

export async function GET(request: Request) {
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const trackedMedicationIds = await getTrackedMedications(uid);
        const availability = await getMedicationAvailability(trackedMedicationIds);

        return NextResponse.json({ availability });

    } catch (error) {
        console.error('Error in GET /api/medications/status:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}