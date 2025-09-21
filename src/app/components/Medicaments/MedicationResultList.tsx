'use client';
import React from 'react';
import MedicationCard from './MedicationCard';
import { Medication } from '../../(app)/medicaments/page';

interface MedicationResultListProps {
  results: Medication[];
}

const MedicationResultList: React.FC<MedicationResultListProps> = ({ results }) => {
  return (
    <div className="results-grid">
      {results.map((med) => (
        <MedicationCard key={med.id} med={med} />
      ))}
    </div>
  );
};

export default MedicationResultList;