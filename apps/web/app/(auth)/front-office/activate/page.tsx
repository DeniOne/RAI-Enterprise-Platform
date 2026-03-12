import { FrontOfficeActivateClient } from './page.client';

export default function FrontOfficeActivatePage({
    searchParams,
}: {
    searchParams?: { token?: string };
}) {
    return <FrontOfficeActivateClient token={searchParams?.token || ''} />;
}
