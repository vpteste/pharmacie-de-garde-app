import { NextResponse } from 'next/server';
import { firestoreAdmin, authAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface InventoryData {
    name: string;
    price: number;
    stock: number;
    updatedAt: FieldValue;
    threshold?: number;
}

// GET handler to fetch the current inventory for a pharmacist
export async function GET(request: Request) {
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'pharmacist') {
            return new NextResponse('Forbidden: User is not a pharmacist', { status: 403 });
        }
        const pharmacyId = userDoc.data()?.pharmacyId;
        if (!pharmacyId) {
             return new NextResponse('Forbidden: Pharmacist has no pharmacy assigned', { status: 403 });
        }

        const inventoryRef = firestoreAdmin.collection('pharmacies').doc(pharmacyId).collection('inventory').orderBy('name', 'asc');
        const snapshot = await inventoryRef.get();

        if (snapshot.empty) {
            return NextResponse.json({ inventory: [] });
        }

        const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ inventory });

    } catch (error) {
        console.error('Error in GET /api/pro/inventory:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// DELETE handler to remove a medication from the inventory
export async function DELETE(request: Request) {
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'pharmacist') {
            return new NextResponse('Forbidden: User is not a pharmacist', { status: 403 });
        }
        const pharmacyId = userDoc.data()?.pharmacyId;
        if (!pharmacyId) {
             return new NextResponse('Forbidden: Pharmacist has no pharmacy assigned', { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const medicationId = searchParams.get('medicationId');
        if (!medicationId) {
            return new NextResponse('Bad Request: medicationId is required', { status: 400 });
        }

        const inventoryDocRef = firestoreAdmin.collection('pharmacies').doc(pharmacyId).collection('inventory').doc(medicationId);
        await inventoryDocRef.delete();

        return NextResponse.json({ success: true, message: `Medication ${medicationId} deleted.` });

    } catch (error) {
        console.error('Error in DELETE /api/pro/inventory:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// POST handler to add or update a medication in the inventory
export async function POST(request: Request) {
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'pharmacist') {
            return new NextResponse('Forbidden: User is not a pharmacist', { status: 403 });
        }
        const pharmacyId = userDoc.data()?.pharmacyId;
        if (!pharmacyId) {
             return new NextResponse('Forbidden: Pharmacist has no pharmacy assigned', { status: 403 });
        }

        const { medicationId, medicationName, price, stock, threshold } = await request.json();
        if (!medicationId || !medicationName || price === undefined || stock === undefined) {
            return new NextResponse('Bad Request: Missing required fields', { status: 400 });
        }

        const inventoryDocRef = firestoreAdmin.collection('pharmacies').doc(pharmacyId).collection('inventory').doc(medicationId);
        
        const dataToSet: Partial<InventoryData> = {
            name: medicationName,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (threshold !== null && threshold !== undefined && !isNaN(parseInt(threshold))) {
            dataToSet.threshold = parseInt(threshold, 10);
        }

        await inventoryDocRef.set(dataToSet, { merge: true });

        return NextResponse.json({ success: true, message: `Inventory updated for ${medicationName}` });

    } catch (error) {
        console.error('Error in POST /api/pro/inventory:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}