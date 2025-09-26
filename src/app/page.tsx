'use client'; // This needs to be a client component to use the hook

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

const PharmacyLogo = () => (
  <svg className="landing-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50,5 L50,95 M5,50 L95,50" stroke="white" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="landing-container">
      <PharmacyLogo />
      <h1 className="landing-title">{t('app_title')}</h1>
      <p className="landing-subtitle">{t('app_subtitle')}</p>
      <Link href="/pharmacies" className="landing-button">
        {t('find_pharmacy')}
      </Link>
    </div>
  );
}
