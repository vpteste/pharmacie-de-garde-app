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

export async function GET(request: Request) {
  initializeFirebaseAdmin();
  const firestoreAdmin = admin.firestore();
  // 1. Secure the endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('Starting on-duty status update process...');
  const batch = firestoreAdmin.batch();
  const now = Timestamp.now();

  try {
    // 1. Find all currently active duties using a collection group query
    const onDutySnapshot = await firestoreAdmin.collectionGroup('duties')
      .where('start', '<=', now)
      .where('end', '>=', now)
      .get();

    const onDutyPharmacyIds = new Set<string>();
    onDutySnapshot.forEach(doc => {
      // The parent of a doc in a subcollection is the document that contains it
      const pharmacyId = doc.ref.parent.parent?.id;
      if (pharmacyId) {
        onDutyPharmacyIds.add(pharmacyId);
      }
    });
    console.log(`${onDutyPharmacyIds.size} pharmacies found to be on duty.`);

    // 2. Get all pharmacies
    const allPharmaciesSnapshot = await firestoreAdmin.collection('pharmacies').get();
    let updatedCount = 0;

    // 3. Iterate and batch update the isOnDuty flag
    allPharmaciesSnapshot.forEach(pharmacyDoc => {
      const pharmacyId = pharmacyDoc.id;
      const pharmacyRef = pharmacyDoc.ref;
      const currentStatus = pharmacyDoc.data().isOnDuty || false;
      const newStatus = onDutyPharmacyIds.has(pharmacyId);

      // Only update if the status has changed to minimize writes
      if (currentStatus !== newStatus) {
        batch.update(pharmacyRef, { isOnDuty: newStatus });
        updatedCount++;
      }
    });

    console.log(`Batching ${updatedCount} updates.`);

    // 4. Commit the batch
    await batch.commit();

    const message = `Process complete. ${updatedCount} pharmacies updated. ${onDutyPharmacyIds.size} total are now on duty.`;
    console.log(message);
    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error("Error updating on-duty status: ", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}