import { PartyDto } from '@/shared/types/party-assets';

export function PartyContactsTab({ party }: { party: PartyDto }) {
  const contacts = party.registrationData?.contacts ?? [];

  if (contacts.length === 0) {
    return <p className="text-sm font-normal text-gray-600">Контакты пока не заполнены.</p>;
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact, index) => (
        <div key={`${contact.fullName}-${index}`} className="rounded-2xl border border-black/10 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Тип контакта" value={contact.roleType === 'SIGNATORY' ? 'Подписант' : 'Операционный'} />
            <Field label="ФИО" value={contact.fullName || '—'} />
            <Field label="Должность" value={contact.position || '—'} />
            <Field label="Основание полномочий" value={contact.basisOfAuthority || '—'} />
            <Field label="Телефон" value={contact.phones || '—'} />
            <Field label="Email" value={contact.email || '—'} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-normal text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-normal text-gray-800">{value}</p>
    </div>
  );
}
