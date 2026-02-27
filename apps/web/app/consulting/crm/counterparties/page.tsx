import { redirect } from 'next/navigation';

export default function LegacyCounterpartiesRedirect() {
  redirect('/parties');
}
