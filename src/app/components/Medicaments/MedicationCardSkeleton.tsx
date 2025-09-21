'use client';
import React from 'react';
import { Card } from 'react-bootstrap';
import './Medicaments.css';

const MedicationCardSkeleton = () => {
  return (
    <Card className="medication-card skeleton">
      <Card.Body>
        <div className="skeleton-line title-skeleton"></div>
        <div className="skeleton-line text-skeleton"></div>
        <div className="skeleton-line text-skeleton short"></div>
        <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="skeleton-line badge-skeleton"></div>
            <div className="skeleton-line button-skeleton"></div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MedicationCardSkeleton;
