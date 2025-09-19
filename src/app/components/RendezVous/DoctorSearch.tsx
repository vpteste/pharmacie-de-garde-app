'use client';
import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';

interface DoctorSearchProps {
  onSearch: (filters: { specialty: string; location: string }) => void;
}

const DoctorSearch: React.FC<DoctorSearchProps> = ({ onSearch }) => {
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ specialty, location });
  };

  return (
    <Form onSubmit={handleSubmit} className="doctor-search-form">
      <Row className="g-2">
        <Col md>
          <Form.Group controlId="specialty">
            <Form.Label>Spécialité</Form.Label>
            <Form.Control
              as="select"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              <option value="">Toutes les spécialités</option>
              <option value="generaliste">Médecin généraliste</option>
              <option value="dentiste">Dentiste</option>
              <option value="cardiologue">Cardiologue</option>
              <option value="pediatre">Pédiatre</option>
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md>
          <Form.Group controlId="location">
            <Form.Label>Lieu</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ville, code postal..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md="auto" className="d-flex align-items-end">
          <Button variant="primary" type="submit" className="w-100">
            Rechercher
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default DoctorSearch;