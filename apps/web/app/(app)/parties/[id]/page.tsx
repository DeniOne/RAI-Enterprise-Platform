import { PartyDetailsPage } from '@/components/party-assets/parties/PartyDetailsPage';

export default function PartyCardRoute({ params }: { params: { id: string } }) {
  return <PartyDetailsPage partyId={params.id} />;
}
