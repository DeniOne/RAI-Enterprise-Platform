import { redirect } from 'next/navigation';
import { EXTERNAL_FRONT_OFFICE_LOGIN_PATH } from '@/lib/front-office-routes';

export default function LegacyFrontOfficeLoginRedirect() {
    redirect(EXTERNAL_FRONT_OFFICE_LOGIN_PATH);
}
