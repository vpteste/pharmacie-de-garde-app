'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from 'react-bootstrap';
import Image from 'next/image';

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    address: string;
    avatar: string;
  };
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  return (
    <div className="doctor-card">
      <div className="doctor-avatar">
         <Image 
            src={doctor.avatar} 
            alt={`Photo de ${doctor.name}`} 
            width={80}
            height={80}
            className="rounded-circle"
          />
      </div>
      <div className="doctor-info">
        <h3>{doctor.name}</h3>
        <p className="specialty">{doctor.specialty}</p>
        <p className="address">{doctor.address}</p>
      </div>
      <div className="doctor-action">
        <Link href={`/rendez-vous/${doctor.id}`} passHref>
          <Button variant="primary">Prendre RDV</Button>
        </Link>
      </div>
    </div>
  );
};

export default DoctorCard;