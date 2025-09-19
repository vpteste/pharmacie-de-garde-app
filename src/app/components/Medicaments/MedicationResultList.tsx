'use client';
import React from 'react';
import { Badge } from 'react-bootstrap';
import './Medicaments.css';

// Types pour les résultats
export type PharmacyStock = {
  id: string;
  name: string;
  address: string;
  stock: 'En stock' | 'Stock faible' | 'En rupture';
};

export type MedicationSearchResult = {
  medicationName: string;
  pharmacies: PharmacyStock[];
};

interface MedicationResultListProps {
  result: MedicationSearchResult;
}

const MedicationResultList: React.FC<MedicationResultListProps> = ({ result }) => {
  const getStockVariant = (stock: PharmacyStock['stock']) => {
    switch (stock) {
      case 'En stock': return 'success';
      case 'Stock faible': return 'warning';
      case 'En rupture': return 'danger';
    }
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <h4>{result.medicationName}</h4>
      </div>
      <div>
        {result.pharmacies.map(pharma => (
          <div key={pharma.id} className="pharmacy-list-item">
            <div>
              <div className="pharmacy-name">{pharma.name}</div>
              <div className="pharmacy-address">{pharma.address}</div>
            </div>
            <Badge bg={getStockVariant(pharma.stock)}>{pharma.stock}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicationResultList;
