import { redirect } from 'next/navigation';

export default function LegacyCrmFarmCardRedirect({ params }: { params: { farmId: string } }) {
  redirect(`/assets/farms/${encodeURIComponent(params.farmId)}`);
}
