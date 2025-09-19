'use client';
import React, { useRef } from 'react';
import { Form } from 'react-bootstrap';
import { Autocomplete } from '@react-google-maps/api';

interface SearchBarProps {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onPlaceSelected }) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (ac: google.maps.places.Autocomplete) => {
    autocompleteRef.current = ac;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.geometry) {
        onPlaceSelected(place);
      } else {
        console.log("User pressed Enter without selecting a valid place.");
      }
    } else {
      console.error('Autocomplete instance is not available');
    }
  };

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      fields={['place_id', 'geometry', 'name', 'formatted_address']}
      options={{
        componentRestrictions: { country: 'ci' }, // Restriction à la Côte d'Ivoire
      }}
    >
      <Form.Control
        type="text"
        placeholder="Rechercher une ville, une adresse..."
      />
    </Autocomplete>
  );
};

export default SearchBar;