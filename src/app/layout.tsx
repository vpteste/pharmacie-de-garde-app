import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import { Providers } from "./providers"; // <-- Changement ici
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
      <body className="main-content">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
