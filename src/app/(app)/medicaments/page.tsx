'use client';
import React, { useState } from 'react';
import MedicationSearch from '../../components/Medicaments/MedicationSearch';
import MedicationResultList, { MedicationSearchResult } from '../../components/Medicaments/MedicationResultList';
import '../../components/Medicaments/Medicaments.css';

// Données simulées de résultat de recherche
const mockSearchResult: MedicationSearchResult = {
  medicationName: 'Doliprane 1000mg',
  pharmacies: [
    {
      id: '1',
      name: 'Pharmacie du Centre',
      address: 'Cocody, Abidjan',
      stock: 'En stock',
    },
    {
      id: '2',
      name: 'Grande Pharmacie d\'Angré',
      address: 'Angré 8ème Tranche, Abidjan',
      stock: 'Stock faible',
    },
    {
      id: '3',
      name: 'Pharmacie du Progrès',
      address: 'Le Plateau, Abidjan',
      stock: 'En rupture',
    },
     {
      id: '4',
      name: 'Pharmacie St. Michel',
      address: 'Marcory, Abidjan',
      stock: 'En stock',
    },
  ],
};

export default function MedicamentsPage() {
  const [searchResult, setSearchResult] = useState<MedicationSearchResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (query: string) => {
    console.log(`Searching for: ${query}`);
    // Pour l'instant, on retourne toujours le même résultat simulé
    setSearchResult(mockSearchResult);
    setSearched(true);
  };

  return (
    <div className="med-container">
      <h2 className="mb-4">Trouver un médicament</h2>
      <MedicationSearch onSearch={handleSearch} />

      {searched && !searchResult && (
        <p>Aucun résultat trouvé pour ce médicament.</p>
      )}

      {searchResult && <MedicationResultList result={searchResult} />}

      {!searched && (
        <div className="text-center text-muted mt-5">
            <p>Veuillez entrer le nom d\'un médicament pour commencer la recherche.</p>
        </div>
      )}
    </div>
  );
}
