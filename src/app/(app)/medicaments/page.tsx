'use client';
import React, { useState, useCallback } from 'react';
import MedicationSearch from '../../components/Medicaments/MedicationSearch';
import MedicationResultList from '../../components/Medicaments/MedicationResultList';
import MedicationCardSkeleton from '../../components/Medicaments/MedicationCardSkeleton';
import { Alert } from 'react-bootstrap';
import '../../components/Medicaments/Medicaments.css';

// --- TYPES ---
export interface Medication {
  id: string;
  name: string;
  description: string;
  category: string;
  requires_prescription: boolean;
}

// --- DUMMY DATA & API SIMULATION ---
const dummyMedications: Medication[] = [
  { id: '1', name: 'Doliprane 1000mg', description: 'Antalgique et antipyrétique.', category: 'Douleurs & Fièvre', requires_prescription: false },
  { id: '2', name: 'Amoxicilline 500mg', description: 'Antibiotique de la famille des pénicillines.', category: 'Antibiotiques', requires_prescription: true },
  { id: '3', name: 'Spasfon 80mg', description: 'Antispasmodique.', category: 'Maux de ventre', requires_prescription: false },
  { id: '4', name: 'Loratadine 10mg', description: 'Antihistaminique pour les allergies.', category: 'Allergies', requires_prescription: false },
  { id: '5', name: 'Imodium 2mg', description: 'Traitement de la diarrhée aiguë.', category: 'Digestion', requires_prescription: false },
  { id: '6', name: 'Tahor 10mg', description: 'Réduction du cholestérol.', category: 'Cardiologie', requires_prescription: true },
  { id: '7', name: 'Ventoline 100µg', description: 'Bronchodilatateur pour l\'asthme.', category: 'Pneumologie', requires_prescription: true },
  { id: '8', name: 'Xanax 0.25mg', description: 'Anxiolytique.', category: 'Psychiatrie', requires_prescription: true },
];

const searchMedicationsAPI = (query: string): Promise<Medication[]> => {
  console.log(`Searching for: ${query}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (query.toLowerCase() === 'error') {
        reject(new Error("Erreur de communication avec le serveur. Veuillez réessayer."));
      }
      const results = dummyMedications.filter(med => 
        med.name.toLowerCase().includes(query.toLowerCase())
      );
      resolve(results);
    }, 1000); // Simule une latence réseau de 1 seconde
  });
};


export default function MedicamentsPage() {
  const [results, ] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const handleSearch = useCallback(async (query: string) => {
    if (!query) return;
    setInitialLoad(false);
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchMedicationsAPI(query);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renderContent = () => {
    if (initialLoad) {
        return (
            <div className="empty-results initial-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-capsule-pill" viewBox="0 0 16 16">
                    <path d="M11.329 1.85a.5.5 0 0 0-.552-.85l-1.42.947a.5.5 0 1 0 .553.85l1.419-.947Z"/>
                    <path d="M13.775 3.225a.5.5 0 0 0-.552-.85l-1.42.947a.5.5 0 1 0 .553.85l1.419-.947Z"/>
                    <path d="M2.225 12.775a.5.5 0 0 0 .552.85l1.42-.947a.5.5 0 1 0-.553-.85l-1.419.947Z"/>
                    <path d="M4.671 11.148a.5.5 0 0 0 .552.85l1.42-.947a.5.5 0 1 0-.553-.85l-1.419.947Z"/>
                    <path d="m10.01 6.328-4.668 4.668a3.5 3.5 0 1 1-4.95-4.95l4.668-4.668a3.5 3.5 0 1 1 4.95 4.95Z"/>
                </svg>
                <p>Recherchez un médicament pour afficher les informations.</p>
            </div>
        );
    }

    if (isLoading) {
      return (
        <div className="results-grid">
          {[...Array(8)].map((_, i) => <MedicationCardSkeleton key={i} />)}
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (results.length === 0) {
      return (
        <div className="empty-results">
          <p>Aucun médicament ne correspond à votre recherche. Veuillez vérifier l&apos;orthographe.</p>
        </div>
      );
    }

    return <MedicationResultList results={results} />;
  };

  return (
    <div className="medicaments-container">
      <header className="medicaments-header">
        <h1>Recherche de Médicaments</h1>
        <p>Trouvez des informations sur des milliers de médicaments.</p>
      </header>
      <MedicationSearch onSearch={handleSearch} />
      <div className="results-container">
        {renderContent()}
      </div>
    </div>
  );
}