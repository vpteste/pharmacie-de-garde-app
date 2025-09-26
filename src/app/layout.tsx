import type { Metadata } from 'next';
import { AppProviders } from '@/app/components/providers'; // Chemin d'importation corrigé
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pharmacie de Garde',
  description: 'Trouvez les pharmacies de garde ouvertes près de chez vous.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-bs-theme="light">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}