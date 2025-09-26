import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authAdmin, firestoreAdmin } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to format the next duty date
const formatNextDuty = (nextDutyDate: Date): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dutyDate = new Date(nextDutyDate);
    dutyDate.setHours(0, 0, 0, 0);

    const diffTime = dutyDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays > 1 && diffDays <= 7) return `Dans ${diffDays} jours`;
    return `Le ${dutyDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
};

export async function GET(request: Request) {
  try {
    // 1. Authentication and Profile Fetching
    const headersList = headers();
    const authorization = headersList.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized: No token provided', { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'pharmacist' || !userDoc.data()?.pharmacyId) {
        return new NextResponse('Forbidden: User is not a valid pharmacist', { status: 403 });
    }
    const pharmacyId = userDoc.data()?.pharmacyId;

    // --- Parallel Data Fetching --- 

    const getMonthlyHours = async () => { /* ... as before */ };
    const getNextDuty = async () => { /* ... as before */ };

    const getMedsAlertCount = async () => {
        const inventorySnapshot = await firestoreAdmin.collection('pharmacies').doc(pharmacyId).collection('inventory').get();
        if (inventorySnapshot.empty) return 0;

        let alertCount = 0;
        inventorySnapshot.forEach(doc => {
            const item = doc.data();
            if (item.threshold !== null && item.threshold !== undefined && item.stock <= item.threshold) {
                alertCount++;
            }
        });
        return alertCount;
    };

    // Run queries in parallel
    const [monthlyHours, nextDuty, medsAlertCount] = await Promise.all([
        getMonthlyHours(),
        getNextDuty(),
        getMedsAlertCount()
    ]);

    // Return combined response
    return NextResponse.json({ monthlyHours, nextDuty, medsAlertCount });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('expired'))) {
        return new NextResponse('Unauthorized: Invalid token', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}