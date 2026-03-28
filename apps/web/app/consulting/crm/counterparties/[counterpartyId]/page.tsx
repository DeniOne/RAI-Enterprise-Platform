import { redirect } from 'next/navigation';

export default async function LegacyCounterpartyCardRedirect({ params }: { params: Promise<{ counterpartyId: string }> }) {
  const { counterpartyId } = await params;
  redirect(`/parties/${encodeURIComponent(counterpartyId)}`);
}
