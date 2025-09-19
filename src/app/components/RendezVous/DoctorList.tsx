'use client';
import React from 'react';
import DoctorCard from './DoctorCard';

interface DoctorListProps {
  doctors: any[];
}

const DoctorList: React.FC<DoctorListProps> = ({ doctors }) => {
  if (doctors.length === 0) {
    return (
      <div className="empty-results">
        <p>Aucun docteur trouvé pour les critères sélectionnés.</p>
      </div>
    );
  }

  return (
    <div className="doctor-list">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}
    </div>
  );
};

export default DoctorList;
