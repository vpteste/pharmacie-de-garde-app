'use client';
import React from 'react';
import SearchBar from './SearchBar';
import './SearchOverlay.css';

interface SearchOverlayProps {
  onClose: () => void;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose, onPlaceSelected }) => {
  return (
    <div className="search-overlay-container">
      <div className="search-overlay-header">
        <SearchBar onPlaceSelected={onPlaceSelected} autoFocus={true} />
        <button onClick={onClose} className="search-overlay-close-btn">Annuler</button>
      </div>
      {/* Les résultats de l'autocomplétion s'afficheront ici via le composant SearchBar */}
    </div>
  );
};

export default SearchOverlay;
