'use client';
import { useJsApiLoader } from '@react-google-maps/api';
import React, { createContext, useContext } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a MapProvider');
  }
  return context;
};

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-main',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places'],
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
