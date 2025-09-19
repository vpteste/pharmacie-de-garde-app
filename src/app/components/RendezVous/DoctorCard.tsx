'use client';
import React from 'react';
import './RendezVous.css';

// Type pour un médecin
export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  address: string;
  avatarUrl: string;
};

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  return (
    <div className="doctor-card">
      <img src={doctor.avatarUrl} alt={`Dr. ${doctor.name}`} className="doctor-avatar" />
      <div className="doctor-info">
        <h5 className="doctor-name">Dr. {doctor.name}</h5>
        <p className="doctor-specialty">{doctor.specialty}</p>
        <p className="doctor-address">{doctor.address}</p>
      </div>
    </div>
  );
};

export default DoctorCard;
