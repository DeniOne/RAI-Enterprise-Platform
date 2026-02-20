'use client';

import React from 'react';
import { GovernanceBar } from './GovernanceBar';
import { DomainTree } from './DomainTree';
import { WorkSurface } from './WorkSurface';

export const GovernanceShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-white text-black font-geist antialiased selection:bg-black selection:text-white">
            <GovernanceBar />
            <div className="flex">
                <DomainTree />
                <WorkSurface>
                    {children}
                </WorkSurface>
            </div>
        </div>
    );
};
