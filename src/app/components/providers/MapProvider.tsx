'use client';

import React, { createContext, useContext } from 'react';
import { useJsApiLoader, LoadScriptProps } from '@react-google-maps/api';

interface MapContextType {
  isLoaded: boolean;
  loadError?: Error;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

const libraries: LoadScriptProps['libraries'] = ['places'];

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  return (
    <MapContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
