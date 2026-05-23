import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistema de Acceso - Gimnasio Tecmilenio',
  description: 'Dashboard en tiempo real para control de acceso NFC'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 font-sans text-zinc-50">{children}</body>
    </html>
  );
}
