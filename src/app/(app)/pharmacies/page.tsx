'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, OverlayView, InfoWindow } from '@react-google-maps/api';
import { useMap } from '@/app/components/providers/MapProvider';
import { useTranslation } from 'react-i18next';
import { Spinner, Badge } from 'react-bootstrap';
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
  currentTraffic: 'Faible' | 'Modérée' | 'Élevée';
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
const CustomMarker = ({ pharmacy, onClick }: { pharmacy: Pharmacy, onClick: () => void }) => {
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
  return <div className={getMarkerClassName()} onClick={onClick} />;
};

const getPixelPositionOffset = (width: number, height: number) => ({
    x: -(width / 2),
    y: -(height / 2),
});

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function PharmaciesPage() {
    const { t } = useTranslation();
    const { isLoaded, loadError } = useMap();
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [selected, setSelected] = useState<Pharmacy | null>(null);
    const [center, _setCenter] = useState({ lat: 5.36, lng: -4.0083 });

    useEffect(() => {
        const fetchPharmacies = async () => {
            try {
                const response = await fetch('/api/pharmacies');
                if (!response.ok) throw new Error('Failed to fetch pharmacies');
                const data = await response.json();
                setPharmacies(data.pharmacies);
            } catch (error) { console.error(error); }
        };
        fetchPharmacies();
    }, []);

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;

    return (
        <div>
            <GoogleMap mapContainerStyle={{ height: '100vh', width: '100%' }} center={center} zoom={12} options={{ disableDefaultUI: true, zoomControl: true }}>
                {pharmacies.filter(p => p.location).map((pharmacy) => (
                    <OverlayView key={pharmacy.id} position={{ lat: pharmacy.location._latitude, lng: pharmacy.location._longitude }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={() => getPixelPositionOffset(20, 20)}>
                        <CustomMarker pharmacy={pharmacy} onClick={() => setSelected(pharmacy)} />
                    </OverlayView>
                ))}

                {selected && (
                    <InfoWindow position={{ lat: selected.location._latitude, lng: selected.location._longitude }} onCloseClick={() => setSelected(null)}>
                        <div style={{ maxWidth: 280 }}>
                            <h5>{selected.name}</h5>
                            <p className="mb-1">{selected.address}</p>
                            <p><strong>{selected.phone}</strong></p>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span>Statut:</span>
                                <Badge bg={getOpenStatus(selected, t).color}>{getOpenStatus(selected, t).text}</Badge>
                            </div>
                            <hr className="my-2"/>
                            <h6>Horaires:</h6>
                            <ul className="list-unstyled" style={{ fontSize: '0.8rem' }}>
                                {selected.openingHours ? (
                                    daysOfWeek.map(day => (
                                        <li key={day} className="d-flex justify-content-between">
                                            <span>{t(`day_${day}`)}:</span>
                                            <strong>{selected.openingHours && selected.openingHours[day]?.isOpen ? `${selected.openingHours[day].open} - ${selected.openingHours[day].close}` : t('closed')}</strong>
                                        </li>
                                    ))
                                ) : (
                                    <li>{t('hours_not_available')}</li>
                                )}
                            </ul>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}