'use client';
import React from 'react';
import DoctorSearch from '../../components/RendezVous/DoctorSearch';
import DoctorList from '../../components/RendezVous/DoctorList';
import '../../components/RendezVous/RendezVous.css';

import { Doctor, SearchFilters } from './types';

// Données de simulation pour les docteurs
const simulatedDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Marie Dubois',
    specialty: 'Médecin généraliste',
    address: '123 Rue de la Santé, 75001 Paris',
    avatar: 'https://i.pravatar.cc/150?img=1' // Image aléatoire
  },
  {
    id: '2',
    name: 'Dr. Jean Martin',
    specialty: 'Dentiste',
    address: '45 Avenue des Dents, 75016 Paris',
    avatar: 'https://i.pravatar.cc/150?img=2'
  },
  {
    id: '3',
    name: 'Dr. Sophie Leroy',
    specialty: 'Cardiologue',
    address: '78 Boulevard du Coeur, 75008 Paris',
    avatar: 'https://i.pravatar.cc/150?img=3'
  }
];

export default function RendezVousPage() {
  // Pour l'instant, la liste des docteurs est statique.
  // const [doctors, setDoctors] = React.useState(simulatedDoctors);

  const handleSearch = (filters: SearchFilters) => {
    console.log('Filtres de recherche:', filters);
    // La logique de filtrage sera implémentée ici
  };

  return (
    <div className="rendezvous-container">
      <header className="rendezvous-header">
        <h1>Prendre un Rendez-vous</h1>
        <p>Trouvez le professionnel de santé qui vous convient.</p>
      </header>
      <DoctorSearch onSearch={handleSearch} />
      <DoctorList doctors={simulatedDoctors} />
    </div>
  );
}