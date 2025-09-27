import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';

// Define a clear type for the items in our inventory sub-collection
interface InventoryItem {
    name: string;
    price: number;
    stock: number;
    threshold?: number;
}

// Type for the item when enriched with its pharmacyId
interface InventoryItemWithPharmacyId extends InventoryItem {
    pharmacyId: string;
}

// This API route performs a public search for medications across all pharmacy inventories.
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const term = searchParams.get('term');

        if (!term || term.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const inventoryQuerySnapshot = await firestoreAdmin
            .collectionGroup('inventory')
            .where('name', '>=', term)
            .where('name', '<=', term + '\uf8ff')
            .get();

        if (inventoryQuerySnapshot.empty) {
            return NextResponse.json({ results: [] });
        }

        const medicationPharmacyMap = new Map<string, InventoryItemWithPharmacyId[]>();
        inventoryQuerySnapshot.docs.forEach(doc => {
            const item = doc.data() as InventoryItem;
            const medicationId = doc.id;
            const pharmacyId = doc.ref.parent.parent!.id;

            if (!medicationPharmacyMap.has(medicationId)) {
                medicationPharmacyMap.set(medicationId, []);
            }
            medicationPharmacyMap.get(medicationId)!.push({ 
                ...item, 
                pharmacyId 
            });
        });

        const allPharmacyIds = [...new Set(inventoryQuerySnapshot.docs.map(doc => doc.ref.parent.parent!.id))];
        const pharmacyDocs = await firestoreAdmin.getAll(...allPharmacyIds.map(id => firestoreAdmin.collection('pharmacies').doc(id)));
        
        const pharmacyDetailsMap = new Map<string, { name: string }>();
        pharmacyDocs.forEach(doc => {
            if(doc.exists) {
                pharmacyDetailsMap.set(doc.id, { name: doc.data()!.name });
            }
        });

        const results = Array.from(medicationPharmacyMap.entries()).map(([medicationId, items]) => {
            return {
                medicationId: medicationId,
                medicationName: items[0].name,
                pharmacies: items.map(item => ({
                    pharmacyId: item.pharmacyId,
                    pharmacyName: pharmacyDetailsMap.get(item.pharmacyId)?.name || 'Unknown Pharmacy',
                    price: item.price,
                    stock: item.stock,
                })).sort((a, b) => a.price - b.price),
            };
        });

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Error in /api/medications/public-search:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}