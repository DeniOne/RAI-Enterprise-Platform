import { redirect } from 'next/navigation';

export default function LegacyCounterpartyCardRedirect({ params }: { params: { counterpartyId: string } }) {
  redirect(`/parties/${encodeURIComponent(params.counterpartyId)}`);
}
