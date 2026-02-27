import { FarmDetailsPage } from '@/components/party-assets/farms/FarmDetailsPage';

export default function FarmCardRoute({ params }: { params: { id: string } }) {
  return <FarmDetailsPage farmId={params.id} />;
}
