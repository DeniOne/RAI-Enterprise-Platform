import { redirect } from 'next/navigation';

export default async function LegacyCrmFarmCardRedirect({ params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  redirect(`/assets/farms/${encodeURIComponent(farmId)}`);
}
