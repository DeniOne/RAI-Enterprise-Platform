import { FarmDetailsPage } from '@/components/party-assets/farms/FarmDetailsPage';

export default async function FarmCardRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FarmDetailsPage farmId={id} />;
}
