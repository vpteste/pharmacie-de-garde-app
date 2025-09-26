import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';

// This API route performs a public search for medications across all pharmacy inventories.
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const term = searchParams.get('term');

        if (!term || term.length < 2) {
            return NextResponse.json({ results: [] });
        }

        // 1. Query all inventory items that match the search term
        const inventoryQuerySnapshot = await firestoreAdmin
            .collectionGroup('inventory')
            .where('name', '>=', term)
            .where('name', '<=', term + '\uf8ff')
            .get();

        if (inventoryQuerySnapshot.empty) {
            return NextResponse.json({ results: [] });
        }

        // 2. Group inventory items by medication ID and collect pharmacy IDs
        const medicationPharmacyMap = new Map<string, any[]>();
        inventoryQuerySnapshot.docs.forEach(doc => {
            const item = doc.data();
            const medicationId = doc.id;
            const pharmacyId = doc.ref.parent.parent!.id; // Get the pharmacy doc ID

            if (!medicationPharmacyMap.has(medicationId)) {
                medicationPharmacyMap.set(medicationId, []);
            }
            medicationPharmacyMap.get(medicationId)!.push({ 
                ...item, 
                pharmacyId 
            });
        });

        // 3. Fetch pharmacy details for all unique pharmacies found
        const allPharmacyIds = [...new Set(inventoryQuerySnapshot.docs.map(doc => doc.ref.parent.parent!.id))];
        const pharmacyDocs = await firestoreAdmin.getAll(...allPharmacyIds.map(id => firestoreAdmin.collection('pharmacies').doc(id)));
        
        const pharmacyDetailsMap = new Map<string, any>();
        pharmacyDocs.forEach(doc => {
            if(doc.exists) {
                pharmacyDetailsMap.set(doc.id, { name: doc.data()!.name });
            }
        });

        // 4. Construct the final response
        const results = Array.from(medicationPharmacyMap.entries()).map(([medicationId, items]) => {
            return {
                medicationId: medicationId,
                medicationName: items[0].name, // All items will have the same name
                pharmacies: items.map(item => ({
                    pharmacyId: item.pharmacyId,
                    pharmacyName: pharmacyDetailsMap.get(item.pharmacyId)?.name || 'Unknown Pharmacy',
                    price: item.price,
                    stockLevel: item.stockLevel,
                })).sort((a, b) => a.price - b.price), // Sort by price ascending
            };
        });

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Error in /api/medications/public-search:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
