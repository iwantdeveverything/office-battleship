import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conciliacion_Bancaria_Q4 - Hojas de cálculo',
  description: 'Internal financial reconciliation and quarterly audit workspace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="h-screen w-screen overflow-hidden select-none bg-[#f8f9fa] text-gray-900">
        {children}
      </body>
    </html>
  );
}
