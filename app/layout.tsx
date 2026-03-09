import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moetly Pay — Blocage de tarif et paiement flexible pour marchands",
  description: "Convertissez plus, risquez moins. Vos clients bloquent le prix avec une prime et épargnent à leur rythme. Transport, événements, hébergement et plus.",
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
