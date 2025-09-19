'use client';
import React from 'react';
import Link from 'next/link';
import { useGoogleMaps } from './components/MapProvider/MapProvider';
import SplashScreen from './components/SplashScreen/SplashScreen';
import './LandingPage.css';

export default function RootPage() {
  const { isLoaded, loadError } = useGoogleMaps();

  if (loadError) {
    return <div>Erreur de chargement de l'API Google Maps. Vérifiez votre connexion ou la configuration de votre clé API.</div>;
  }

  if (!isLoaded) {
    return <SplashScreen />;
  }

  return (
    <div className="landing-page">
      <h1 className="landing-title">Pharmacies de Garde</h1>
      <p className="landing-subtitle">Votre santé, notre priorité, partout, tout le temps.</p>
      <Link href="/pharmacies" passHref>
        <button className="landing-button">
          Trouver une pharmacie
        </button>
      </Link>
    </div>
  );
};
