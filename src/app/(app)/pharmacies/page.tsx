'use client';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer, DirectionsService } from '@react-google-maps/api';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import PharmacySidebar from '../../components/PharmacySidebar/PharmacySidebar';
import SearchOverlay from '../../components/PharmacySidebar/SearchOverlay';
import DirectionsList from '../../components/PharmacySidebar/DirectionsList';
import BlinkingMarker from '../../components/BlinkingMarker/BlinkingMarker';
import './pharmacies.css'; // Importer la nouvelle feuille de style

// --- TYPES ---
type Pharmacy = { id: string; name: string; address: string; lat: number; lng: number; distance?: number; onDutyStatus?: string; };
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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngLiteral | null>(null);
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]); // All pharmacies from API
  const [onDutyOnly, setOnDutyOnly] = useState(true); // Filter state, on by default
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedPharmacyDetails, setSelectedPharmacyDetails] = useState<PharmacyDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [isDirectionsMode, setIsDirectionsMode] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [reportedPharmacies, setReportedPharmacies] = useState<Set<string>>(new Set());
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isRecentering, setIsRecentering] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [apiErrorDetails, setApiErrorDetails] = useState<any>(null);
  const locationInitialized = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- DATA FETCHING ---
  const fetchPharmacies = useCallback(async (lat: number, lng: number) => {
    if (!userLocation) return;
    setApiErrorDetails(null);
    try {
      const response = await fetch(`/api/pharmacies?lat=${lat}&lng=${lng}`);
      if (!response.ok) {
        const errorData = await response.json();
        setApiErrorDetails(errorData);
        throw new Error('Failed to fetch pharmacies');
      }
      let data: Pharmacy[] = await response.json();
      data = data.map(p => ({ ...p, distance: getDistance(userLocation, { lat: p.lat, lng: p.lng }) }));
      data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setAllPharmacies(data);
    } catch (error) {
      console.error(error);
    }
  }, [userLocation]);

  // Filter pharmacies based on the onDutyOnly toggle
  const displayedPharmacies = useMemo(() => {
    if (onDutyOnly) {
      return allPharmacies.filter(p => p.onDutyStatus && p.onDutyStatus !== 'aucune');
    }
    return allPharmacies;
  }, [allPharmacies, onDutyOnly]);

  // --- GEOLOCATION & INITIAL LOAD ---
  useEffect(() => {
    if (map && !userLocation && !locationInitialized.current) {
      if (navigator.geolocation) {
        locationInitialized.current = true; // Lock to prevent re-running
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
      } else {
        // Geolocation not supported, set default location
        locationInitialized.current = true;
        const defaultLoc = { lat: 5.3600, lng: -4.0083 };
        setUserLocation(defaultLoc);
        map.panTo(defaultLoc);
      }
    }
  }, [map, userLocation]);

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

  const handleRecenter = () => {
    if (!map || !navigator.geolocation) return;
    setIsRecentering(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(newLocation);
        map.panTo(newLocation);
        setIsRecentering(false);
      },
      () => {
        setIsRecentering(false);
      }
    );
  };

  const handlePlaceSelected = useCallback((place: google.maps.places.PlaceResult) => {
    if (map && place.geometry?.location) {
      const newLocation = place.geometry.location;
      map.panTo(newLocation);
      map.setZoom(15);
    }
  }, [map]);

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
      setDirectionsError("Impossible de calculer l&apos;itinéraire.");
    }
  };

  // --- RENDER ---
  const onLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);

  const pharmacyMarkerIcon = { url: '/pharmacy-cross.svg', scaledSize: new window.google.maps.Size(30, 30), };
  const selectedPharmacyMarkerIcon = { url: '/pharmacy-cross.svg', scaledSize: new window.google.maps.Size(50, 50) };
  const userLocationIcon = { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" };

  return (
    <div className="main-layout">
      {isMobile && isSearchMode && 
        <SearchOverlay 
          onClose={() => setIsSearchMode(false)} 
          onPlaceSelected={(place) => {
            handlePlaceSelected(place);
            setIsSearchMode(false);
          }}
        />
      }
      {apiErrorDetails && (
        <Alert variant="danger" className="m-3">
            <h4>Erreur de l'API</h4>
            <pre>{JSON.stringify(apiErrorDetails, null, 2)}</pre>
        </Alert>
      )}
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
                            <><Spinner animation="border" /> <p>Calcul de l&apos;itinéraire...</p></>
                        }
                    </div>
                )}
            </div>
        ) : (
            <PharmacySidebar 
              pharmacies={displayedPharmacies} // Use filtered list
              onDutyOnly={onDutyOnly}
              setOnDutyOnly={setOnDutyOnly}
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
          {isMobile && !isDirectionsMode && (
            <button
              onClick={() => setIsSearchMode(true)}
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                width: '40px', 
                height: '40px', 
                backgroundColor: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          )}

          <button 
            onClick={handleRecenter}
            style={{
              position: 'absolute',
              top: '80px',
              right: '10px',
              width: '40px', 
              height: '40px', 
              backgroundColor: 'white', 
              border: 'none', 
              borderRadius: '50%', 
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            disabled={isRecentering}
          >
            {isRecentering ? <Spinner animation="border" size="sm" /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <line x1="12" y1="3" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="21" />
                <line x1="21" y1="12" x2="18" y2="12" />
                <line x1="6" y1="12" x2="3" y2="12" />
              </svg>
            )}
          </button>

          {/* Service pour calculer l'itinéraire (ne rend rien de visible) */}
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

          {/* Logique de rendu mutuellement exclusive */}
          {directionsResponse ? (
            <>
              {/* Affiche la ligne de l'itinéraire SANS les marqueurs A/B */}
              <DirectionsRenderer directions={directionsResponse} options={{ suppressMarkers: true }} />

              {/* Et on affiche nos propres marqueurs personnalisés */}
              {userLocation && <Marker position={userLocation} label="Vous" />} 
              {selectedPharmacyDetails && 
                <Marker 
                  position={{ lat: selectedPharmacyDetails.lat, lng: selectedPharmacyDetails.lng }} 
                  label="Votre Pharmacie" 
                />
              }
            </>
          ) : (
            <>
              {/* SINON (pas de réponse d'itinéraire), on affiche les marqueurs normaux */}
              {userLocation && <Marker position={userLocation} icon={userLocationIcon} />}
              
              {displayedPharmacies.map((pharmacy) => {
                const isOnDuty = pharmacy.onDutyStatus && pharmacy.onDutyStatus !== 'aucune';
                
                if (selectedPharmacy?.id === pharmacy.id) {
                    // Use a standard, non-blinking marker for the selected one for stability
                    return (
                        <Marker
                            key={pharmacy.id}
                            position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
                            onClick={() => handleMarkerClick(pharmacy)}
                            icon={selectedPharmacyMarkerIcon}
                            zIndex={3} 
                        />
                    );
                }

                if (isOnDuty) {
                    return (
                        <BlinkingMarker 
                            key={pharmacy.id}
                            lat={pharmacy.lat}
                            lng={pharmacy.lng}
                            onClick={() => handleMarkerClick(pharmacy)}
                        />
                    );
                }

                return (
                    <Marker
                      key={pharmacy.id}
                      position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
                      onClick={() => handleMarkerClick(pharmacy)}
                      icon={pharmacyMarkerIcon}
                      zIndex={1}
                    />
                );
              })}
            </>
          )}

          {/* L'info-bulle (uniquement en mode exploration) */}
          {!isDirectionsMode && selectedPharmacy && (
            <InfoWindow
              position={{ lat: selectedPharmacy.lat, lng: selectedPharmacy.lng }}
              onCloseClick={() => {
                setSelectedPharmacy(null);
              }}
            >
              <div style={{ fontFamily: 'sans-serif', fontSize: '14px', minWidth: '300px', padding: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                <h6 style={{ fontWeight: 'bold', fontSize: '17px', margin: '0 0 12px 0', color: '#3fc17a' }}>{selectedPharmacy.name}</h6>
                {isDetailsLoading ? <div style={{display: 'flex', justifyContent: 'center', padding: '20px'}}><Spinner animation="border" size="sm" /></div> : selectedPharmacyDetails ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <StatusIcon status={selectedPharmacyDetails.status} />
                      <span style={{
                        fontWeight: 'bold',
                        fontSize: '15px',
                        color: selectedPharmacyDetails.status === 'Ouvert' ? '#28a745' : '#dc3545'
                      }}>
                        {selectedPharmacyDetails.status}
                      </span>
                    </div>
                    <div>
                      <p style={{ margin: '0', color: '#555', fontWeight: 500 }}>{selectedPharmacyDetails.address}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0', color: '#555', fontWeight: 500 }}>Tél: {selectedPharmacyDetails.phone_number || 'Non disponible'}</p>
                    </div>
                    <hr style={{ margin: '10px 0 5px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button variant="primary" size="sm" onClick={handleGetDirections}>Y aller</Button>
                      <Button 
                          variant="link"
                          size="sm"
                          onClick={handleReportError}
                          disabled={reportedPharmacies.has(selectedPharmacyDetails.id)}
                          style={{ color: reportedPharmacies.has(selectedPharmacyDetails.id) ? '#28a745' : '#6c757d', textDecoration: 'none', fontSize: '12px' }}
                      >
                          {reportedPharmacies.has(selectedPharmacyDetails.id) ? "Merci !" : "Signaler une erreur"}
                      </Button>
                    </div>
                  </div>
                ) : <p>Détails non disponibles.</p>}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
