import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function for Firebase Admin initialization
function initializeFirebaseAdmin() {
    if (admin.apps.length === 0) {
        try {
            const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            if (!serviceAccountJson) {
                throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set in environment variables.");
            }
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (error) {
            // We don't throw here, to allow the function to return a proper error response
        }
    }
    return admin;
}

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
    initializeFirebaseAdmin();
    const authAdmin = admin.auth();
    const firestoreAdmin = admin.firestore();
    const authorization = request.headers.get('Authorization');
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

    const getMonthlyHours = async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const dutiesSnapshot = await firestoreAdmin.collection('pharmacies').doc(pharmacyId).collection('duties')
            .where('start', '>=', Timestamp.fromDate(startOfMonth))
            .where('start', '<=', Timestamp.fromDate(endOfMonth))
            .get();
        if (dutiesSnapshot.empty) return 0;
        let totalMilliseconds = 0;
        dutiesSnapshot.forEach(doc => {
            const duty = doc.data();
            totalMilliseconds += duty.end.toMillis() - duty.start.toMillis();
        });
        return Math.round(totalMilliseconds / (1000 * 60 * 60));
    };

    const getNextDuty = async () => {
        const now = new Date();
        const nextDutySnapshot = await firestoreAdmin.collection('pharmacies').doc(pharmacyId).collection('duties')
            .where('start', '>=', Timestamp.fromDate(now))
            .orderBy('start', 'asc')
            .limit(1)
            .get();
        if (nextDutySnapshot.empty) return "Aucune programmée";
        const nextDuty = nextDutySnapshot.docs[0].data();
        return formatNextDuty(nextDuty.start.toDate());
    };

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

    const [monthlyHours, nextDuty, medsAlertCount] = await Promise.all([
        getMonthlyHours(),
        getNextDuty(),
        getMedsAlertCount()
    ]);

    return NextResponse.json({ monthlyHours, nextDuty, medsAlertCount });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    if (error instanceof Error && (error.message.includes('token'))) {
        return new NextResponse('Unauthorized: Invalid token', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
