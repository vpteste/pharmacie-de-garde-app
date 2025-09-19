'use client';
import React from 'react';
import './RendezVous.css';

interface DoctorSearchProps {
  onSearchChange: (query: string) => void;
}

const DoctorSearch: React.FC<DoctorSearchProps> = ({ onSearchChange }) => {
  return (
    <input 
      type="text"
      placeholder="Rechercher un médecin ou une spécialité..."
      className="search-input"
      onChange={(e) => onSearchChange(e.target.value)}
    />
  );
};

export default DoctorSearch;
