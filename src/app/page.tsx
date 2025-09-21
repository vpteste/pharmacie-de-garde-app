'use client';
import React from 'react';
import Link from 'next/link';
import './LandingPage.css';

export default function RootPage() {
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
