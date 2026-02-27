import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { FarmCreateWizard } from '@/components/party-assets/farms/FarmCreateWizard';

export default function FarmCreateRoute() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Новое хозяйство" description="Создание только сущности хозяйства" />
      <FarmCreateWizard />
    </div>
  );
}
