import { FrontOfficeActivateClient } from '../../../front-office/activate/page.client';

export default function PortalFrontOfficeActivatePage({
    searchParams,
}: {
    searchParams?: { token?: string };
}) {
    return <FrontOfficeActivateClient token={searchParams?.token || ''} />;
}
