'use client';
import React, { useState } from 'react';
import DoctorList from '../../components/RendezVous/DoctorList';
import DoctorSearch from '../../components/RendezVous/DoctorSearch';
import { Doctor } from '../../components/RendezVous/DoctorCard';
import '../../components/RendezVous/RendezVous.css';

// Données simulées de médecins
const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Amina Diallo',
    specialty: 'Cardiologue',
    address: 'Clinique La Providence, Cocody, Abidjan',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    name: 'Koffi Martin',
    specialty: 'Pédiatre',
    address: 'Hôpital Mère-Enfant, Bingerville',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    name: 'Fatou Bamba',
    specialty: 'Dermatologue',
    address: 'Centre Médical Le Plateau, Abidjan',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    name: 'Yao N\'Guessan',
    specialty: 'Médecin Généraliste',
    address: 'Cabinet Médical Les 2 Plateaux, Abidjan',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
  },
];

export default function RendezVousPage() {
  const [filteredDoctors, setFilteredDoctors] = useState(mockDoctors);

  const handleSearchChange = (query: string) => {
    const lowerCaseQuery = query.toLowerCase();
    if (!lowerCaseQuery) {
      setFilteredDoctors(mockDoctors);
      return;
    }
    const filtered = mockDoctors.filter(doctor => 
      doctor.name.toLowerCase().includes(lowerCaseQuery) ||
      doctor.specialty.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredDoctors(filtered);
  };

  return (
    <div className="rv-container">
      <h2 className="mb-4">Prendre un rendez-vous</h2>
      <DoctorSearch onSearchChange={handleSearchChange} />
      <DoctorList doctors={filteredDoctors} />
    </div>
  );
}
