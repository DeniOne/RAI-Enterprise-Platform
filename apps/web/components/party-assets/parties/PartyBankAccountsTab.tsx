import { PartyDto } from '@/shared/types/party-assets';

export function PartyBankAccountsTab({ party }: { party: PartyDto }) {
  const banks = party.registrationData?.banks ?? [];

  if (banks.length === 0) {
    return <p className="text-sm font-normal text-gray-600">Банковские счета пока не заполнены.</p>;
  }

  return (
    <div className="space-y-4">
      {banks.map((bank, index) => (
        <div key={`${bank.bankName}-${index}`} className="rounded-2xl border border-black/10 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Банк" value={bank.bankName || '—'} />
            <Field label="Расчётный счёт / IBAN" value={bank.accountNumber || '—'} />
            <Field label="БИК / SWIFT" value={bank.bic || '—'} />
            <Field label="Корреспондентский счёт" value={bank.corrAccount || '—'} />
            <Field label="Валюта" value={bank.currency || '—'} />
            <Field label="Основной" value={bank.isPrimary ? 'Да' : 'Нет'} />
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
