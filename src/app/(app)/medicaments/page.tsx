'use client';
import React from 'react';
import MedicationSearch from '../../components/Medicaments/MedicationSearch';
import MedicationResultList from '../../components/Medicaments/MedicationResultList';
import '../../components/Medicaments/Medicaments.css';

export default function MedicamentsPage() {
  // Pour l'instant, nous utiliserons des données statiques
  const [results, setResults] = React.useState([]);

  const handleSearch = (query: string) => {
    console.log('Recherche de:', query);
    // Ici, nous appellerons une API à l'avenir.
    // Pour le moment, la liste reste vide.
  };

  return (
    <div className="medicaments-container">
      <header className="medicaments-header">
        <h1>Recherche de Médicaments</h1>
        <p>Trouvez des informations sur des milliers de médicaments.</p>
      </header>
      <MedicationSearch onSearch={handleSearch} />
      <MedicationResultList results={results} />
    </div>
  );
}