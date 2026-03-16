import { PageHeader } from '@/components/party-assets/common/PageHeader';
import { FieldCreateWizard } from '@/components/party-assets/fields/FieldCreateWizard';

export default function FieldCreateRoute() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Новое поле" description="Создание поля в Field Registry с автоматическим переходом в мастер подготовки Техкарты" />
      <FieldCreateWizard />
    </div>
  );
}
