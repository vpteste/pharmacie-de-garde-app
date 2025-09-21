'use client';
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Medication } from '../../(app)/medicaments/page'; // Importer le type
import './Medicaments.css';

interface MedicationCardProps {
  med: Medication;
}

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
