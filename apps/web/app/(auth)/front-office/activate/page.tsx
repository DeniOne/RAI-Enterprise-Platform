import { redirect } from 'next/navigation';
import { EXTERNAL_FRONT_OFFICE_ACTIVATE_PATH } from '@/lib/front-office-routes';

export default function LegacyFrontOfficeActivateRedirect({
    searchParams,
}: {
    searchParams?: { token?: string };
}) {
    const token = searchParams?.token?.trim();
    const target = token
        ? `${EXTERNAL_FRONT_OFFICE_ACTIVATE_PATH}?token=${encodeURIComponent(token)}`
        : EXTERNAL_FRONT_OFFICE_ACTIVATE_PATH;

    redirect(target);
}
