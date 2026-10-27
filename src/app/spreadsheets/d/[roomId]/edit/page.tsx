import type { Metadata } from 'next';
import { SpreadsheetAppClient } from '@/components/SpreadsheetAppClient';

interface DisguisedRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({
  params,
}: DisguisedRoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  const decodedRoomId = decodeURIComponent(roomId).toUpperCase();
  const title = `Q4_Reconciliation_${decodedRoomId}.xlsx - Cloud Spreadsheets`;
  const description = `Shared external audit ledger (${decodedRoomId}) — Annex A & Annex B variance reconciliation.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function DisguisedSpreadsheetRoomPage({ params }: DisguisedRoomPageProps) {
  const { roomId } = await params;
  return <SpreadsheetAppClient initialRoomId={decodeURIComponent(roomId)} />;
}
