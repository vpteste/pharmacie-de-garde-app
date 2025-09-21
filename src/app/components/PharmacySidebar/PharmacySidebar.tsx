'use client';
import React from 'react';
import SearchBar from './SearchBar';
import PharmacyList from './PharmacyList';
import { Form } from 'react-bootstrap';

// Types
type Pharmacy = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
  onDutyStatus?: string;
};

interface PharmacySidebarProps {
  pharmacies: Pharmacy[];
  selectedPharmacy: Pharmacy | null;
  onPharmacySelect: (pharmacy: Pharmacy) => void;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  isMobileSheetOpen: boolean;
  setIsMobileSheetOpen: (isOpen: boolean) => void;
  onDutyOnly: boolean;
  setOnDutyOnly: (value: boolean) => void;
}

const PharmacySidebar: React.FC<PharmacySidebarProps> = ({ 
  pharmacies, 
  selectedPharmacy, 
  onPharmacySelect, 
  onPlaceSelected, 
  isMobileSheetOpen,
  setIsMobileSheetOpen,
  onDutyOnly,
  setOnDutyOnly
}) => {
  // ... component body ...
};

export default React.memo(PharmacySidebar);
