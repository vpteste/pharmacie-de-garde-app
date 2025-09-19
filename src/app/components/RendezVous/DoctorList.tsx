'use client';
import React from 'react';
import Link from 'next/link';
import DoctorCard, { Doctor } from './DoctorCard';

interface DoctorListProps {
  doctors: Doctor[];
}

const DoctorList: React.FC<DoctorListProps> = ({ doctors }) => {
  return (
    <div>
      {doctors.map(doctor => (
        <Link key={doctor.id} href={`/rendez-vous/${doctor.id}`} style={{ textDecoration: 'none' }}>
            <DoctorCard doctor={doctor} />
        </Link>
      ))}
    </div>
  );
};

export default DoctorList;