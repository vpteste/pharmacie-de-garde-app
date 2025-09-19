'use client';
import React from 'react';
import { ListGroup } from 'react-bootstrap';

// Types
type Pharmacy = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
};

interface PharmacyListProps {
  pharmacies: Pharmacy[];
  selectedPharmacy: Pharmacy | null;
  onPharmacySelect: (pharmacy: Pharmacy) => void;
}

const PharmacyList: React.FC<PharmacyListProps> = ({ pharmacies, selectedPharmacy, onPharmacySelect }) => {
  if (pharmacies.length === 0) {
    return <p>Aucune pharmacie trouvée à proximité.</p>;
  }

  return (
    <ListGroup style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
      {pharmacies.map((pharmacy) => (
        <ListGroup.Item 
          key={pharmacy.id} 
          action 
          onClick={() => onPharmacySelect(pharmacy)}
          active={selectedPharmacy?.id === pharmacy.id}
        >
          <div className="d-flex w-100 justify-content-between">
            <h6 className="mb-1">{pharmacy.name}</h6>
            {pharmacy.distance !== undefined && (
                <small>{pharmacy.distance.toFixed(1)} km</small>
            )}
          </div>
          <p className="mb-1 text-muted" style={{fontSize: '0.9rem'}}>{pharmacy.address}</p>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default PharmacyList;
