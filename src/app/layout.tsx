import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import { MapProvider } from "./components/MapProvider/MapProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pharmacies de Garde",
  description: "Trouvez les pharmacies de garde ouvertes près de chez vous.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <MapProvider>
          {children}
        </MapProvider>
      </body>
    </html>
  );
}
