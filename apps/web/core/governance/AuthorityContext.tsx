/**
 * @file AuthorityContext.tsx
 * @description Центральный контекст управления полномочиями (Capabilities) в системе RAI.
 * Строго запрещено использование user.role в UI. Все компоненты должны потреблять флаги из этого контекста.
 */

'use client';

import React, { createContext, useContext, useMemo } from 'react';

export interface AuthorityContextType {
    canOverride: boolean;  // Право форсированного перехода FSM (Level C)
    canSign: boolean;      // Право участия в кворуме (Level F)
    canEscalate: boolean;  // Право ручного триггера эскалации
    canEdit: boolean;      // Право модификации полей в текущем состоянии
    canApprove: boolean;   // Право окончательного подтверждения (Finality)
}

export type UserRole = 'CEO' | 'DIRECTOR' | 'MANAGER' | 'AGRONOMIST' | 'GUEST';

export const ROLE_CAPABILITIES: Record<UserRole, AuthorityContextType> = {
    CEO: { canOverride: true, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    DIRECTOR: { canOverride: false, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    MANAGER: { canOverride: false, canSign: false, canEscalate: true, canEdit: true, canApprove: false },
    AGRONOMIST: { canOverride: false, canSign: false, canEscalate: false, canEdit: true, canApprove: false },
    GUEST: { canOverride: false, canSign: false, canEscalate: false, canEdit: false, canApprove: false },
};

const AuthorityContext = createContext<AuthorityContextType | null>(null);

/**
 * Провайдер полномочий. 
 * В реальной системе данные должны приходить из зашифрованного JWT или защищенного API.
 * На Фазе 1 используется Role Simulation Layer.
 */
export const AuthorityProvider: React.FC<{
    role: UserRole;
    children: React.ReactNode
}> = ({ role, children }) => {
    const capabilities = useMemo(() => ROLE_CAPABILITIES[role], [role]);

    return (
        <AuthorityContext.Provider value={capabilities}>
            {children}
        </AuthorityContext.Provider>
    );
};

export const useAuthority = () => {
    const context = useContext(AuthorityContext);
    if (!context) {
        throw new Error('useAuthority must be used within an AuthorityProvider');
    }
    return context;
};
