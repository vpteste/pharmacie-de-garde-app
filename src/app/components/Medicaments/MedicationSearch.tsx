'use client';
import React, { useState } from 'react';
import './Medicaments.css';

interface MedicationSearchProps {
  onSearch: (query: string) => void;
}

const MedicationSearch: React.FC<MedicationSearchProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="med-search-form">
      <input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Entrez le nom d'un médicament..."
        className="med-search-input"
      />
      <button type="submit" className="med-search-button">Rechercher</button>
    </form>
  );
};

export default MedicationSearch;
