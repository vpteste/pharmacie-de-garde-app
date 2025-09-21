'use client';

import { MapProvider } from './components/MapProvider/MapProvider';

// Ce composant regroupe tous les providers côté client.
// Si vous ajoutez d'autres providers (Theme, Redux, etc.), ils viendront ici.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      {children}
    </MapProvider>
  );
}
