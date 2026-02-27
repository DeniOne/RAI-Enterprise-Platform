import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { PartyCreateWizard } from '@/components/party-assets/parties/PartyCreateWizard';

export default function PartyCreateRoute() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Новый контрагент" description="Создание только сущности контрагента" />
      <PartyCreateWizard />
    </div>
  );
}
