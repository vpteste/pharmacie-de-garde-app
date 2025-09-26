'use client';

import '@/i18n'; // Initialize i18next
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeProvider';
import { MapProvider } from './MapProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
        <AuthProvider>
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </AuthProvider>
    </MapProvider>
  );
}
