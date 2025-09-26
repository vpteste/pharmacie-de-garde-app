'use client';

import Navbar from '@/app/components/Navbar/Navbar';
import { MapProvider } from '@/app/components/providers/MapProvider';

// Ce layout s'applique à toutes les pages internes de l'application (dans le groupe "app")
// Il garantit la présence de la barre de navigation sur ces pages.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <MapProvider>
          {children}
        </MapProvider>
      </main>
    </>
  );
}
