import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Surtify — precios de gasolineras en comunidad',
  description:
    'Encuentra y comparte precios reales de gasolineras, mantenidos por una comunidad en tiempo real.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#E8A400',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-body">{children}</body>
    </html>
  );
}
