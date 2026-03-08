import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moetly Pay — Paiement différé pour marchands de billets d'avion",
  description: "Augmentez vos ventes avec le paiement différé. Liens de paiement en 30 secondes, dashboard temps réel, API disponible. Commission simple de 5%.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
