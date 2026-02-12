export type UserRole = 
    | 'ADMIN' 
    | 'MANAGER' 
    | 'AGRONOMIST' 
    | 'FIELD_WORKER' 
    | 'CLIENT_ADMIN' 
    | 'USER'
    | 'SYSTEM_ADMIN'
    | 'FOUNDER'
    | 'CEO'
    | 'DIRECTOR_HR'
    | 'DIRECTOR_OFS'
    | 'DIRECTOR_ECONOMY'
    | 'DIRECTOR_FINANCE'
    | 'DIRECTOR_GR'
    | 'DIRECTOR_PRODUCTION';

export interface ModuleConfig {
    id: string;
    label: string;
    path: string;
    icon?: string;
}

export const MODULES: Record<string, ModuleConfig> = {
    CMR: { id: 'CMR', label: 'CMR', path: '/strategic' },
    HR: { id: 'HR', label: 'HR', path: '/hr' },
    OFS: { id: 'OFS', label: 'ОФС', path: '/ofs' },
    ECONOMY: { id: 'ECONOMY', label: 'Экономика', path: '/economy' },
    FINANCE: { id: 'FINANCE', label: 'Финансы', path: '/finance' },
    GR: { id: 'GR', label: 'GR', path: '/gr' },
    PRODUCTION: { id: 'PRODUCTION', label: 'Производство', path: '/production' },
    FRONT_OFFICE: { id: 'FRONT_OFFICE', label: 'Front-office', path: '/front-office' },
};

export const ROLE_PERMISSIONS: Record<UserRole | string, string[]> = {
    SYSTEM_ADMIN: ['CMR', 'HR', 'OFS', 'ECONOMY', 'FINANCE', 'GR', 'PRODUCTION', 'FRONT_OFFICE'],
    FOUNDER: ['CMR', 'HR', 'OFS', 'ECONOMY', 'FINANCE', 'GR', 'PRODUCTION', 'FRONT_OFFICE'],
    CEO: ['CMR', 'HR', 'OFS', 'ECONOMY', 'FINANCE', 'GR', 'PRODUCTION', 'FRONT_OFFICE'],
    DIRECTOR_HR: ['HR'],
    DIRECTOR_OFS: ['OFS'],
    DIRECTOR_ECONOMY: ['ECONOMY'],
    DIRECTOR_FINANCE: ['FINANCE'],
    DIRECTOR_GR: ['GR'],
    DIRECTOR_PRODUCTION: ['PRODUCTION'],
    MANAGER: ['CMR', 'FRONT_OFFICE'],
    AGRONOMIST: ['CMR', 'FRONT_OFFICE'],
    ADMIN: ['CMR', 'HR', 'OFS', 'ECONOMY', 'FINANCE', 'GR', 'PRODUCTION', 'FRONT_OFFICE'],
    USER: ['CMR', 'FRONT_OFFICE'],
};

export function getVisibleModules(role: string): ModuleConfig[] {
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['USER'];
    return permissions.map(id => MODULES[id]).filter(Boolean);
}
