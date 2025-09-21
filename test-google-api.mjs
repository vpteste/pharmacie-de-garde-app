const apiKey = "AIzaSyAMOq5RLoGMELAd7UXN8_p9xNzS4BBY4-s";
const lat = 5.4118818;
const lng = -3.9473211;
const url = 'https://places.googleapis.com/v1/places:searchNearby';

console.log('--- Démarrage du Test API Google ---');
console.log(`Clé API utilisée: ${apiKey ? 'Oui' : 'Non'}`);

async function runTest() {
  try {
    console.log('Envoi de la requête à l\'API Google Places...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id' // Champ minimal pour le test
      },
      body: JSON.stringify({
        includedTypes: ['pharmacy'],
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: 5000.0 },
        },
      }),
    });

    console.log(`Réponse reçue avec le statut: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('--- TEST ÉCHOUÉ (Erreur API) ---');
      console.error(JSON.stringify(errorData, null, 2));
    } else {
      const data = await response.json();
      console.log('--- TEST RÉUSSI ---');
      console.log(`Trouvé ${data.places?.length || 0} pharmacies.`);
    }
  } catch (error) {
    console.error('--- TEST ÉCHOUÉ (Erreur Fetch) ---');
    console.error(error);
  }
}

runTest();
