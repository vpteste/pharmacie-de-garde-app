'use client';
import React from 'react';
import SearchBar from './SearchBar';
import PharmacyList from './PharmacyList';

// Types
type Pharmacy = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
};

interface PharmacySidebarProps {
  pharmacies: Pharmacy[];
  selectedPharmacy: Pharmacy | null;
  onPharmacySelect: (pharmacy: Pharmacy) => void;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  isMobileSheetOpen: boolean;
  setIsMobileSheetOpen: (isOpen: boolean) => void;
}

const PharmacySidebar: React.FC<PharmacySidebarProps> = ({ 
  pharmacies, 
  selectedPharmacy, 
  onPharmacySelect, 
  onPlaceSelected, 
  isMobileSheetOpen,
  setIsMobileSheetOpen
}) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div 
        onClick={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
        style={{ 
          width: '40px', 
          height: '5px', 
          borderRadius: '2.5px', 
          background: '#ccc', 
          margin: '10px auto', 
          cursor: 'pointer' 
        }}
        className="d-md-none"
      />
      <div style={{ padding: '0 20px 20px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h5 className="d-none d-md-block">Pharmacies de Garde</h5>
        <div 
          className="mb-3" 
          onFocus={() => setIsMobileSheetOpen(true)} // Ouvre le panneau au focus
        >
          <SearchBar onPlaceSelected={onPlaceSelected} />
        </div>
        <PharmacyList 
          pharmacies={pharmacies} 
          selectedPharmacy={selectedPharmacy}
          onPharmacySelect={onPharmacySelect} 
        />
      </div>
    </div>
  );
};

export default PharmacySidebar;
