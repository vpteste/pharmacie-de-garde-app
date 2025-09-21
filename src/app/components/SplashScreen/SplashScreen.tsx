'use client';
import React from 'react';
import Image from 'next/image';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <Image src="/pharmacy-cross.svg" alt="Loading icon" className="splash-icon" width={80} height={80} />
    </div>
  );
};

export default SplashScreen;
