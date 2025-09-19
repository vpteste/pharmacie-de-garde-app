'use client';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer, DirectionsService } from '@react-google-maps/api';
import { useState, useEffect, useCallback } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useGoogleMaps } from '../../components/MapProvider/MapProvider';
import PharmacySidebar from '../../components/PharmacySidebar/PharmacySidebar';
import DirectionsList from '../../components/PharmacySidebar/DirectionsList';

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

// --- STYLES & ICONS ---
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
];

const StatusIcon = ({ status }: { status: string }) => (
    <svg height="20" width="20" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
        <circle cx="10" cy="10" r="6" fill={status === 'Ouvert' ? '#28a745' : '#dc3545'} />
    </svg>
);

export default function PharmaciesPage() {
  // --- STATE MANAGEMENT ---
  const { isLoaded, loadError } = useGoogleMaps(); // Utilise le contexte global
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngLiteral | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedPharmacyDetails, setSelectedPharmacyDetails] = useState<PharmacyDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [isDirectionsMode, setIsDirectionsMode] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [reportedPharmacies, setReportedPharmacies] = useState<Set<string>>(new Set());
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

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
    setIsMobileSheetOpen(true);
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

  const handleReportError = async () => {
    if (!selectedPharmacyDetails) return;
    try {
      await fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: selectedPharmacyDetails.id,
          name: selectedPharmacyDetails.name,
          address: selectedPharmacyDetails.address,
        }),
      });
      setReportedPharmacies(prev => new Set(prev).add(selectedPharmacyDetails.id));
    } catch (error) {
      console.error("Failed to report error:", error);
    }
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

  if (loadError) return <div>Erreur de chargement de l'API Google Maps. Vérifiez votre clé et vos autorisations.</div>;
  if (!isLoaded) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><Spinner animation="border" /></div>; // Spinner simple pour le chargement de la page

  const pharmacyMarkerIcon = { url: '/pharmacy-cross.svg', scaledSize: new window.google.maps.Size(35, 35) };
  const selectedPharmacyMarkerIcon = { url: '/pharmacy-cross.svg', scaledSize: new window.google.maps.Size(50, 50) };
  const userLocationIcon = { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" };

  return (
    <div className="main-layout">
      <div className={`sidebar-container ${isMobileSheetOpen ? 'open' : ''}`}>
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
              isMobileSheetOpen={isMobileSheetOpen}
              setIsMobileSheetOpen={setIsMobileSheetOpen}
            />
        )}
      </div>
      <div className="map-container" onClick={() => { if (isMobileSheetOpen) setIsMobileSheetOpen(false); }}>
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
              onCloseClick={() => {
                setSelectedPharmacy(null);
                setIsMobileSheetOpen(false);
              }}
            >
              <div style={{ fontFamily: 'sans-serif', fontSize: '14px', minWidth: '280px', padding: '5px' }}>
                <h6 style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 10px 0' }}>{selectedPharmacy.name}</h6>
                {isDetailsLoading ? <Spinner animation="border" size="sm" /> : selectedPharmacyDetails ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <StatusIcon status={selectedPharmacyDetails.status} />
                      <span style={{ fontWeight: selectedPharmacyDetails.status === 'Ouvert' ? 'bold' : 'normal' }}>
                        {selectedPharmacyDetails.status}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 8px 0', color: '#555' }}>{selectedPharmacyDetails.address}</p>
                    <p style={{ margin: '0 0 12px 0', color: '#555' }}>Tél: {selectedPharmacyDetails.phone_number}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button variant="primary" size="sm" onClick={handleGetDirections}>Y aller</Button>
                      <Button 
                          variant="link"
                          size="sm"
                          onClick={handleReportError}
                          disabled={reportedPharmacies.has(selectedPharmacyDetails.id)}
                          style={{ color: reportedPharmacies.has(selectedPharmacyDetails.id) ? '#28a745' : '#6c757d', textDecoration: 'none' }}
                      >
                          {reportedPharmacies.has(selectedPharmacyDetails.id) ? "Merci !" : "Signaler..."}
                      </Button>
                    </div>
                  </>
                ) : <p>Détails non disponibles.</p>}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
