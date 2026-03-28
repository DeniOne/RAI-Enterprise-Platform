import { Suspense } from 'react';
import { TechMapPreparationWizard } from '@/components/consulting/TechMapPreparationWizard';

export default function TechMapPreparationRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Загрузка мастера техкарты...</div>}>
      <TechMapPreparationWizard />
    </Suspense>
  );
}
