'use client';
import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

interface MedicationSearchProps {
  onSearch: (query: string) => void;
}

const MedicationSearch: React.FC<MedicationSearchProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <Form onSubmit={handleSubmit} className="medication-search-form">
      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          placeholder="Entrez le nom d'un médicament..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Nom du médicament"
        />
        <Button variant="primary" type="submit">
          Rechercher
        </Button>
      </InputGroup>
    </Form>
  );
};

export default MedicationSearch;