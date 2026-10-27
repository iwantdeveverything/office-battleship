import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://office-battleship.vercel.app'
  ),
  title: 'Conciliacion_Bancaria_Q4.xlsx - Cloud Spreadsheets',
  description:
    'Enterprise Q4 general ledger reconciliation, variance analysis, and multi-auditor worksheet.',
  openGraph: {
    title: 'Conciliacion_Bancaria_Q4.xlsx - Cloud Spreadsheets',
    description:
      'Shared corporate ledger reconciliation workbook. Verify Annex A & Annex B balances in real time.',
    type: 'website',
    siteName: 'Cloud Spreadsheets Enterprise',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conciliacion_Bancaria_Q4.xlsx - Cloud Spreadsheets',
    description:
      'Enterprise Q4 general ledger reconciliation and real-time multi-auditor worksheet.',
  },
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
