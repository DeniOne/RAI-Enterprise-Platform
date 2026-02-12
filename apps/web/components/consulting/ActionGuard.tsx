'use client';

import React from 'react';
import { UiPermissionResult } from '@/lib/consulting/ui-policy';

interface ActionGuardProps {
    permission: UiPermissionResult;
    action: 'edit' | 'approve' | 'transition';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function ActionGuard({ permission, action, children, fallback }: ActionGuardProps) {
    let hasAccess = false;

    switch (action) {
        case 'edit':
            hasAccess = permission.canEdit;
            break;
        case 'approve':
            hasAccess = permission.canApprove;
            break;
        case 'transition':
            hasAccess = permission.allowedTransitions.length > 0;
            break;
    }

    if (!hasAccess) {
        return fallback || null;
    }

    return <>{children}</>;
}
