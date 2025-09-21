'use client';
import Navbar from '../components/Navbar/Navbar';
import './layout.css';
import { useGoogleMaps } from '../components/MapProvider/MapProvider';
import SplashScreen from '../components/SplashScreen/SplashScreen';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useGoogleMaps();

  if (loadError) {
    return <div>Erreur de chargement de l'API Google Maps. Vérifiez votre connexion ou la configuration de votre clé API.</div>;
  }

  if (!isLoaded) {
    return <SplashScreen />;
  }

  return (
    <>
      <Navbar />
      <main className="page-content">{children}</main>
    </>
  );
}
