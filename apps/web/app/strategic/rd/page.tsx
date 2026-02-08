import React from 'react';
import { cookies } from 'next/headers';
import { strategicApi } from '@/lib/api/strategic';
import RdContextView from './RdContextView';

export default async function RdPage() {
    const token = cookies().get('auth_token')?.value || '';
    const experiments = await strategicApi.getRdSummary(token);

    // Mock legal status for each experiment for UI demonstration
    const experimentsWithLegal = Array.isArray(experiments) ? experiments.map((exp: any) => ({
        ...exp,
        legalStatus: exp.state === 'RUNNING' ? 'OK' : 'ATTENTION',
        protocolStatus: exp.activeProtocolId ? 'APPROVED' : 'DRAFT'
    })) : [];

    return (
        <RdContextView experiments={experimentsWithLegal} />
    );
}
