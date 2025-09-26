import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';

// This is a temporary development route to populate the global medications collection.
// In a real application, this would be handled by a dedicated admin interface.

const MEDICATIONS_TO_ADD = [
    { id: 'paracetamol-500', name: 'Paracétamol 500mg', description: 'Analgésique et antipyrétique.' },
    { id: 'ibuprofene-400', name: 'Ibuprofène 400mg', description: 'Anti-inflammatoire non stéroïdien.' },
    { id: 'amoxicilline-1g', name: 'Amoxicilline 1g', description: 'Antibiotique à large spectre.' },
    { id: 'spasfon-lyoc-80', name: 'Spasfon Lyoc 80mg', description: 'Traitement des douleurs spasmodiques.' },
    { id: 'smecta-pdr', name: 'Smecta', description: 'Pansement digestif pour diarrhées aiguës.' },
    { id: 'gaviscon-susp', name: 'Gaviscon Suspension Buvable', description: 'Traitement du reflux gastro-œsophagien.' },
    { id: 'doliprane-1000', name: 'Doliprane 1000mg', description: 'Analgésique et antipyrétique.' },
    { id: 'cetirizine-10', name: 'Cétirizine 10mg', description: 'Antihistaminique pour les allergies.' },
    { id: 'prednisolone-20', name: 'Prednisolone 20mg', description: 'Corticoïde anti-inflammatoire stéroïdien.' },
    { id: 'tahor-10', name: 'Tahor 10mg (Atorvastatine)', description: 'Hypocholestérolémiant.' },
];

export async function GET() {
    try {
        const batch = firestoreAdmin.batch();
        let count = 0;

        for (const med of MEDICATIONS_TO_ADD) {
            const docRef = firestoreAdmin.collection('medications').doc(med.id);
            // We set it directly, overwriting any existing data to ensure consistency.
            batch.set(docRef, { name: med.name, description: med.description });
            count++;
        }

        await batch.commit();

        const message = `Successfully populated ${count} medications in the 'medications' collection.`;
        console.log(message);
        return NextResponse.json({ message });

    } catch (error) {
        console.error('Error populating medications:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
