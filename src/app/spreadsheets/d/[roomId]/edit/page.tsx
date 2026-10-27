import { SpreadsheetAppClient } from '@/components/SpreadsheetAppClient';

interface DisguisedRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function DisguisedSpreadsheetRoomPage({ params }: DisguisedRoomPageProps) {
  const { roomId } = await params;
  return <SpreadsheetAppClient initialRoomId={decodeURIComponent(roomId)} />;
}
