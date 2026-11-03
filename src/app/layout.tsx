import type { Metadata } from 'next';
import './globals.css';
import { WorkshopProvider } from '@/context/WorkshopContext';

export const metadata: Metadata = {
  title: 'TallerTrack | Gestión y Tracking para Taller Mecánico',
  description:
    'Prototipo móvil interactivo de seguimiento de reparación automotriz para mecánicos y clientes vía WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <WorkshopProvider>{children}</WorkshopProvider>
      </body>
    </html>
  );
}
