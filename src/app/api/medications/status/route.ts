import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';

// This API route gets the status for a specific list of medication IDs.
export async function POST(request: Request) {
    try {
        const { medicationIds } = await request.json();

        if (!medicationIds || !Array.isArray(medicationIds) || medicationIds.length === 0) {
            return new NextResponse('Bad Request: medicationIds array is required', { status: 400 });
        }

        // Use a Set for faster lookups
        const medicationIdSet = new Set(medicationIds);

        // Query all inventory items that are in the requested list of medications
        const inventoryQuerySnapshot = await firestoreAdmin
            .collectionGroup('inventory')
            .where(firestoreAdmin.documentId(), 'in', medicationIds)
            .get();

        // This is the same logic as the public search, just constrained to the requested IDs.
        // In a real-world high-traffic app, this data would be denormalized or aggregated for performance.

        const medicationPharmacyMap = new Map<string, any[]>();
        inventoryQuerySnapshot.docs.forEach(doc => {
            const item = doc.data();
            const medicationId = doc.id;
            const pharmacyId = doc.ref.parent.parent!.id;

            if (!medicationPharmacyMap.has(medicationId)) {
                medicationPharmacyMap.set(medicationId, []);
            }
            medicationPharmacyMap.get(medicationId)!.push({ ...item, pharmacyId });
        });

        const allPharmacyIds = [...new Set(inventoryQuerySnapshot.docs.map(doc => doc.ref.parent.parent!.id))];
        const pharmacyDocs = allPharmacyIds.length > 0 
            ? await firestoreAdmin.getAll(...allPharmacyIds.map(id => firestoreAdmin.collection('pharmacies').doc(id)))
            : [];
        
        const pharmacyDetailsMap = new Map<string, any>();
        pharmacyDocs.forEach(doc => {
            if(doc.exists) {
                pharmacyDetailsMap.set(doc.id, { name: doc.data()!.name });
            }
        });

        const results = Array.from(medicationPharmacyMap.entries()).map(([medicationId, items]) => ({
            medicationId: medicationId,
            medicationName: items[0].name,
            pharmacies: items.map(item => ({
                pharmacyId: item.pharmacyId,
                pharmacyName: pharmacyDetailsMap.get(item.pharmacyId)?.name || 'Unknown Pharmacy',
                price: item.price,
                stockLevel: item.stockLevel,
            })).sort((a, b) => a.price - b.price),
        }));

        // Ensure we return an entry for every requested ID, even if not found
        const finalResults = medicationIds.map(id => {
            const found = results.find(r => r.medicationId === id);
            if (found) return found;
            // We need the name of the medication even if not in stock anywhere
            // This requires another fetch, or passing names from the client.
            // For now, we will return a placeholder.
            return { medicationId: id, medicationName: id, pharmacies: [] };
        });

        return NextResponse.json({ results: finalResults });

    } catch (error) {
        console.error('Error in /api/medications/status:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
