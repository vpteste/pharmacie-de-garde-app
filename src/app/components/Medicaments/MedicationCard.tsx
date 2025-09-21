'use client';
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Medication } from '../../(app)/medicaments/page'; // Importer le type
import './Medicaments.css';

interface MedicationCardProps {
  med: Medication;
}

const PillIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-capsule me-2" viewBox="0 0 16 16">
        <path d="M1.828 8.9-3.536 3.536a1 1 0 0 1 0-1.414l1.414-1.414a1 1 0 0 1 1.414 0L8.9 8.172a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 0 1-1.414 0L1.828 8.9Zm9.428-5.364a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 0 1-1.414 0L3.536 1.828a1 1 0 0 1 1.414 0l5.364 5.364Z"/>
    </svg>
);

const MedicationCard: React.FC<MedicationCardProps> = ({ med }) => {
  return (
    <Card className="medication-card h-100">
      <Card.Body className="d-flex flex-column">
        <div className="mb-2">
            <small className="text-muted fw-bold text-uppercase">{med.category}</small>
        </div>
        <Card.Title className="medication-name">{med.name}</Card.Title>
        <Card.Text className="flex-grow-1">{med.description}</Card.Text>
        <div className="mt-auto">
            {med.requires_prescription && (
                <Badge pill bg="warning" text="dark" className="mb-3">
                    Sur ordonnance
                </Badge>
            )}
            <Button variant="outline-primary" className="w-100">Voir les détails</Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MedicationCard;
