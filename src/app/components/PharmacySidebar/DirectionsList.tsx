'use client';
import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap'; // Ajout de Badge ici

interface DirectionsListProps {
  steps: google.maps.DirectionsStep[];
}

const DirectionsList: React.FC<DirectionsListProps> = ({ steps }) => {
  return (
    <ListGroup variant="flush" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', borderTop: '1px solid #dee2e6' }}>
      {steps.map((step, index) => (
        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-start">
          <div 
            className="ms-2 me-auto" 
            dangerouslySetInnerHTML={{ __html: step.instructions || '' }} 
          />
          <Badge bg="light" text="dark" pill>
            {step.distance?.text}
          </Badge>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default DirectionsList;