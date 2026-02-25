import fs from 'node:fs';
import path from 'node:path';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

describe('Phase 7 domain governance contract', () => {
    it('enforces governance-core layout integration for business domains', () => {
        const governedLayouts = [
            'app/consulting/layout.tsx',
            'app/crm/layout.tsx',
            'app/dashboard/layout.tsx',
            'app/strategic/layout.tsx',
            'app/(app)/economy/layout.tsx',
            'app/(app)/finance/layout.tsx',
            'app/(app)/gr/layout.tsx',
            'app/(app)/hr/layout.tsx',
            'app/(app)/ofs/layout.tsx',
            'app/(app)/production/layout.tsx',
            'app/(app)/front-office/layout.tsx',
        ];

        for (const file of governedLayouts) {
            const source = read(file);
            const usesInstitutionalLayout =
                source.includes('AuthenticatedLayout') ||
                (source.includes('GovernanceBar') && source.includes('WorkSurface'));
            expect(usesInstitutionalLayout).toBe(true);
        }
    });
});

