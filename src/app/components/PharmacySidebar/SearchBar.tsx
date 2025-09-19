'use client';
import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { Autocomplete } from '@react-google-maps/api';

interface SearchBarProps {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onPlaceSelected }) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onLoad = (ac: google.maps.places.Autocomplete) => {
    setAutocomplete(ac);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      onPlaceSelected(place);
    } else {
      console.error('Autocomplete is not loaded yet!');
    }
  };

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      // On peut restreindre la recherche à un pays si besoin, ex: options={{ componentRestrictions: { country: "ci" } }}
    >
      <Form.Control
        type="text"
        placeholder="Rechercher une ville, une adresse..."
      />
    </Autocomplete>
  );
};

export default SearchBar;