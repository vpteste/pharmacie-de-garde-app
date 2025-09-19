'use client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer, DirectionsService } from '@react-google-maps/api';
import { useState, useEffect, useCallback } from 'react';
import { Badge, Button, Spinner } from 'react-bootstrap';
import PharmacySidebar from './components/PharmacySidebar/PharmacySidebar';
import DirectionsList from './components/PharmacySidebar/DirectionsList';

// --- TYPES ---
type Pharmacy = { id: string; name: string; address: string; lat: number; lng: number; distance?: number };
type PharmacyDetails = Pharmacy & { status: string; phone_number: string; };
type LatLngLiteral = google.maps.LatLngLiteral;

// --- HELPERS ---
function getDistance(p1: LatLngLiteral, p2: LatLngLiteral) {
  const R = 6371; // Radius of the earth in km
  const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
  const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// --- STYLES ---
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

export default function Home() {
  // --- STATE MANAGEMENT ---
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-main',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngLiteral | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedPharmacyDetails, setSelectedPharmacyDetails] = useState<PharmacyDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [isDirectionsMode, setIsDirectionsMode] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  // --- DATA FETCHING ---
  const fetchPharmacies = useCallback(async (lat: number, lng: number) => {
    if (!userLocation) return;
    try {
      const response = await fetch(`/api/pharmacies?lat=${lat}&lng=${lng}`);
      if (!response.ok) throw new Error('Failed to fetch pharmacies');
      let data: Pharmacy[] = await response.json();
      data = data.map(p => ({ ...p, distance: getDistance(userLocation, { lat: p.lat, lng: p.lng }) }));
      data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setPharmacies(data);
    } catch (error) {
      console.error(error);
    }
  }, [userLocation]);

  // --- GEOLOCATION & INITIAL LOAD ---
  useEffect(() => {
    if (map) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(loc);
                    map.panTo(loc);
                    map.setZoom(14);
                },
                () => { 
                    const defaultLoc = { lat: 5.3600, lng: -4.0083 };
                    setUserLocation(defaultLoc);
                    map.panTo(defaultLoc);
                }
            );
        }
    }
  }, [map]);

  // --- EVENT HANDLERS ---
  const handleMapIdle = useCallback(() => {
    if (map && !isDirectionsMode && userLocation) {
        const newCenter = map.getCenter()?.toJSON();
        if (newCenter) {
            fetchPharmacies(newCenter.lat, newCenter.lng);
        }
    }
  }, [map, fetchPharmacies, isDirectionsMode, userLocation]);

  const handleMarkerClick = useCallback(async (pharmacy: Pharmacy) => {
    if (isDirectionsMode) return;
    setSelectedPharmacy(pharmacy);
    map?.panTo({ lat: pharmacy.lat, lng: pharmacy.lng });
    setIsDetailsLoading(true);
    setSelectedPharmacyDetails(null);
    try {
      const response = await fetch(`/api/pharmacy-details?placeId=${pharmacy.id}`);
      if (!response.ok) throw new Error('Failed to fetch pharmacy details');
      const details: PharmacyDetails = await response.json();
      setSelectedPharmacyDetails(details);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDetailsLoading(false);
    }
  }, [map, isDirectionsMode]);

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (map && place.geometry?.location) {
      const newLocation = place.geometry.location;
      map.panTo(newLocation);
      map.setZoom(15);
    }
  };

  const handleGetDirections = () => {
    if (!userLocation || !selectedPharmacy) return;
    setDirectionsError(null);
    setDirectionsResponse(null);
    setIsDirectionsMode(true);
    setSelectedPharmacy(null);
  };

  const clearDirections = () => {
    setDirectionsResponse(null);
    setIsDirectionsMode(false);
    setDirectionsError(null);
  };

  const directionsCallback = (res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === 'OK' && res) {
      setDirectionsResponse(res);
      setDirectionsError(null);
    } else {
      setDirectionsError("Impossible de calculer l'itinéraire.");
    }
  };

  // --- RENDER ---
  const onLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);

  if (loadError) return <div>Erreur de chargement de la carte.</div>;
  if (!isLoaded) return <div>Chargement de l'application...</div>;

  const pharmacyMarkerIcon = { url: '/pharmacy-cross.svg', scaledSize: new window.google.maps.Size(35, 35) };
  const selectedPharmacyMarkerIcon = { url: '/pharmacy-cross.svg', scaledSize: new window.google.maps.Size(50, 50) }; // Plus grand
  const userLocationIcon = { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" };

  return (
    <div className="main-layout">
      <div className="sidebar-container">
        {isDirectionsMode ? (
            <div style={{padding: '20px', height: '100%', display: 'flex', flexDirection: 'column'}}>
                <Button variant="secondary" onClick={clearDirections} className="mb-3">Retour à la liste</Button>
                {directionsResponse ? (
                    <>
                        <h5>Itinéraire vers {selectedPharmacyDetails?.name}</h5>
                        <p className="text-muted">{directionsResponse.routes[0].legs[0].distance?.text} ({directionsResponse.routes[0].legs[0].duration?.text})</p>
                        <DirectionsList steps={directionsResponse.routes[0].legs[0].steps} />
                    </>
                ) : (
                    <div className="text-center mt-4">
                        {directionsError ? 
                            <p className='text-danger'>{directionsError}</p> : 
                            <><Spinner animation="border" /> <p>Calcul de l'itinéraire...</p></>
                        }
                    </div>
                )}
            </div>
        ) : (
            <PharmacySidebar 
              pharmacies={pharmacies}
              selectedPharmacy={selectedPharmacy}
              onPharmacySelect={handleMarkerClick}
              onPlaceSelected={handlePlaceSelected}
            />
        )}
      </div>
      <div className="map-container">
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          center={userLocation || { lat: 5.3600, lng: -4.0083 }}
          zoom={12}
          onLoad={onLoad}
          onIdle={handleMapIdle}
          options={{ disableDefaultUI: true, zoomControl: true, styles: mapStyles }}
        >
          {userLocation && <Marker position={userLocation} icon={userLocationIcon} />}

          {isDirectionsMode && userLocation && selectedPharmacyDetails && (
            <DirectionsService
              options={{
                destination: { lat: selectedPharmacyDetails.lat, lng: selectedPharmacyDetails.lng },
                origin: userLocation,
                travelMode: google.maps.TravelMode.DRIVING
              }}
              callback={directionsCallback}
            />
          )}
          {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}

          {!isDirectionsMode && pharmacies.map((pharmacy) => (
            <Marker
              key={pharmacy.id}
              position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
              onClick={() => handleMarkerClick(pharmacy)}
              icon={selectedPharmacy?.id === pharmacy.id ? selectedPharmacyMarkerIcon : pharmacyMarkerIcon}
            />
          ))}

          {!isDirectionsMode && selectedPharmacy && (
            <InfoWindow
              position={{ lat: selectedPharmacy.lat, lng: selectedPharmacy.lng }}
              onCloseClick={() => setSelectedPharmacy(null)}
            >
              <div style={{ padding: '5px' }}>
                <h5 style={{ marginBottom: '10px' }}>{selectedPharmacy.name}</h5>
                {isDetailsLoading ? <p>Chargement...</p> : selectedPharmacyDetails ? (
                  <>
                    <p style={{ marginBottom: '0.5rem' }}>{selectedPharmacyDetails.address}</p>
                    <p style={{ marginBottom: '0.5rem' }}>Tél: {selectedPharmacyDetails.phone_number}</p>
                    <div style={{ marginBottom: '1rem' }}>
                      <Badge bg={selectedPharmacyDetails.status === 'Ouvert' ? 'success' : 'danger'}>
                        {selectedPharmacyDetails.status}
                      </Badge>
                    </div>
                    <Button variant="primary" size="sm" onClick={handleGetDirections}>Y aller</Button>
                  </>
                ) : <p>{selectedPharmacy.address}</p>}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
