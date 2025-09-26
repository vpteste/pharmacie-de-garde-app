import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';

// This API route searches the global medications collection.
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const term = searchParams.get('term');

        if (!term) {
            return new NextResponse('Bad Request: search term is required', { status: 400 });
        }

        const medicationsRef = firestoreAdmin.collection('medications');
        
        // Firestore does not support case-insensitive searches natively.
        // A common workaround is to store an all-lowercase version of the name.
        // For this implementation, we will do a case-sensitive prefix search.
        const query = medicationsRef
            .where('name', '>=', term)
            .where('name', '<=', term + '\uf8ff')
            .limit(10);

        const snapshot = await query.get();

        if (snapshot.empty) {
            return NextResponse.json({ medications: [] });
        }

        const medications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ medications });

    } catch (error) {
        console.error('Error in /api/medications/search:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
