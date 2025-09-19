'use client';
import React from 'react';
import { Card, Button } from 'react-bootstrap';

interface MedicationResultListProps {
  results: any[]; // Nous utiliserons 'any' pour le moment
}

const MedicationResultList: React.FC<MedicationResultListProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="empty-results">
        <p>Aucun médicament à afficher. Lancez une recherche pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="results-grid">
      {results.map((med, index) => (
        <Card key={index} className="medication-card">
          <Card.Body>
            <Card.Title>{med.name}</Card.Title>
            <Card.Text>{med.description}</Card.Text>
            <Button variant="outline-primary">Voir les détails</Button>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default MedicationResultList;