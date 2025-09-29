'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, OverlayView, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { useMap } from '@/app/components/providers/MapProvider';
import { useTranslation } from 'react-i18next';
import { Spinner, Badge, Button } from 'react-bootstrap';
import { FaCrosshairs, FaRoute, FaPhone, FaCheckCircle } from 'react-icons/fa';
import './Pharmacies.css';

// --- Types ---
interface DayHours { isOpen: boolean; open: string; close: string; }
interface WeekHours { [day: string]: DayHours; }
interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  location: { _latitude: number; _longitude: number; };
  isOnDuty: boolean;
  isOfficial?: boolean; // For the badge
  openingHours: WeekHours | null;
}

// --- Helper Function for Open Status ---
const getOpenStatus = (pharmacy: Pharmacy, t: (key: string) => string) => {
    if (pharmacy.isOnDuty) {
        return { text: t('status_on_duty'), color: 'primary' };
    }
    if (!pharmacy.openingHours) {
        return { text: t('status_hours_unavailable'), color: 'secondary' };
    }

    const now = new Date();
    const dayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const dayName = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex];
    const todayHours = pharmacy.openingHours[dayName];

    if (!todayHours || !todayHours.isOpen) {
        return { text: t('closed'), color: 'danger' };
    }

    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
    
    const openTime = new Date();
    openTime.setHours(openHour, openMinute, 0, 0);

    const closeTime = new Date();
    closeTime.setHours(closeHour, closeMinute, 0, 0);

    if (now >= openTime && now <= closeTime) {
        return { text: t('open'), color: 'success' };
    } else {
        return { text: t('closed'), color: 'danger' };
    }
};

// --- Components ---
const CustomMarker = ({ pharmacy }: { pharmacy: Pharmacy }) => {
  const getMarkerClassName = () => {
    let className = 'map-marker';
    if (pharmacy.isOnDuty) {
      className += ' pulsing';
      className += ' marker-green'; 
    } else {
      className += ' marker-grey';
    }
    return className;
  };
  return <div className={getMarkerClassName()} />;
};

const UserMarker = () => <div className="user-marker"></div>;

const getPixelPositionOffset = (width: number, height: number) => ({
    x: -(width / 2),
    y: -(height / 2),
});

export default function PharmaciesPage() {
    const { t } = useTranslation();
    const { isLoaded, loadError } = useMap();
    const mapRef = useRef<google.maps.Map | null>(null);

    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [selected, setSelected] = useState<Pharmacy | null>(null);
    const [center, setCenter] = useState({ lat: 5.36, lng: -4.0083 }); // Default center
    const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

    const fetchPharmacies = useCallback(async (lat: number, lng: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pharmacies?lat=${lat}&lng=${lng}&radius=500000`); // 500km radius
            if (!response.ok) throw new Error('Failed to fetch pharmacies');
            const data = await response.json();
            setPharmacies(data.pharmacies || []);
        } catch (error) { 
            console.error(error); 
            setPharmacies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleGeolocate = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setCenter(pos);
                setUserPosition(pos);
                mapRef.current?.panTo(pos);
                mapRef.current?.setZoom(14);
                fetchPharmacies(pos.lat, pos.lng);
            }, () => { fetchPharmacies(center.lat, center.lng); });
        } else { fetchPharmacies(center.lat, center.lng); }
    }, [center.lat, center.lng, fetchPharmacies]);

    useEffect(() => { handleGeolocate(); }, [handleGeolocate]);

    const onMapLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);

    const onMapIdle = useCallback(() => {
        if (mapRef.current) {
            const newCenter = mapRef.current.getCenter()?.toJSON();
            if (newCenter) { fetchPharmacies(newCenter.lat, newCenter.lng); }
        }
    }, [fetchPharmacies]);

    const handleShowDirections = (pharmacy: Pharmacy) => {
        if (!userPosition) return;

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: userPosition,
                destination: { lat: pharmacy.location._latitude, lng: pharmacy.location._longitude },
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    setDirections(result);
                    setSelected(null); // Close info window to show the route
                } else {
                    console.error(`error fetching directions ${result}`);
                }
            }
        );
    };

    const handleMarkerClick = (pharmacy: Pharmacy) => {
        setDirections(null); // Clear previous directions
        setSelected(pharmacy);
    }

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;

    return (
        <div className="pharmacy-map-container">
            <GoogleMap 
                mapContainerStyle={{ height: '100%', width: '100%' }} 
                center={center} 
                zoom={12} 
                options={{ disableDefaultUI: true, zoomControl: true }}
                onLoad={onMapLoad}
                onIdle={onMapIdle}
            >
                {pharmacies.filter(p => p.location).map((pharmacy) => (
                    <OverlayView key={pharmacy.id} position={{ lat: pharmacy.location._latitude, lng: pharmacy.location._longitude }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={() => getPixelPositionOffset(20, 20)}>
                        <div onClick={() => handleMarkerClick(pharmacy)}>
                            <CustomMarker pharmacy={pharmacy} />
                        </div>
                    </OverlayView>
                ))}

                {userPosition && (
                     <OverlayView position={userPosition} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={() => getPixelPositionOffset(24, 24)}>
                        <UserMarker />
                    </OverlayView>
                )}

                {selected && (
                    <InfoWindow position={{ lat: selected.location._latitude, lng: selected.location._longitude }} onCloseClick={() => setSelected(null)}>
                        <div className="info-window-content">
                            <div className="iw-header">
                                <h5>{selected.name}</h5>
                                {selected.isOfficial && 
                                    <span className="iw-badge" title="Établissement référencé">
                                        <FaCheckCircle /> Référencée
                                    </span>
                                }
                            </div>
                            <div className="iw-body">
                                <p className="mb-1">{selected.address}</p>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Statut:</span>
                                    <Badge bg={getOpenStatus(selected, t).color}>{getOpenStatus(selected, t).text}</Badge>
                                </div>
                            </div>
                            <div className="iw-actions">
                                <button className="iw-button route" onClick={() => handleShowDirections(selected)}>
                                    <FaRoute /> {t('directions_button') || 'Itinéraire'}
                                </button>
                                <a className="iw-button call" href={`tel:${selected.phone}`}>
                                    <FaPhone /> {t('call_button') || 'Appeler'}
                                </a>
                            </div>
                        </div>
                    </InfoWindow>
                )}

                {directions && (
                    <DirectionsRenderer directions={directions} />
                )}
            </GoogleMap>
            <Button variant="light" className="geolocate-btn" onClick={handleGeolocate} title={t('geolocate_button')}>
                <FaCrosshairs />
            </Button>
            {loading && <div className="map-loading-overlay"><Spinner animation="border" variant="primary" /></div>}
        </div>
    );
}