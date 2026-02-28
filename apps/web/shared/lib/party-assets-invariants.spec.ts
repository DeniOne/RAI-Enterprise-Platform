
import {
    validateDateRange,
    validateOwnershipRelation,
    hasOverlappingAssetRole,
    hasOwnershipOrManagementCycle
} from './party-assets-invariants';
import { PartyRelationDto, AssetPartyRoleDto } from '@/shared/types/party-assets';

describe('Party Assets Invariants', () => {
    describe('validateDateRange', () => {
        it('should allow valid range', () => {
            expect(validateDateRange('2026-01-01', '2026-12-31')).toBeNull();
        });

        it('should error on invalid range', () => {
            expect(validateDateRange('2026-12-31', '2026-01-01')).toBe('Дата начала должна быть раньше даты окончания.');
        });

        it('should allow open-ended range', () => {
            expect(validateDateRange('2026-01-01', undefined)).toBeNull();
        });
    });

    describe('validateOwnershipRelation', () => {
        it('should validate share percentage for OWNERSHIP', () => {
            const relation: any = { relationType: 'OWNERSHIP', sharePct: 150, validFrom: '2026-01-01' };
            expect(validateOwnershipRelation(relation)).toBe('Для связи владения доля должна быть в диапазоне (0..100].');
        });

        it('should allow valid OWNERSHIP', () => {
            const relation: any = { relationType: 'OWNERSHIP', sharePct: 50, validFrom: '2026-01-01' };
            expect(validateOwnershipRelation(relation)).toBeNull();
        });
    });

    describe('hasOverlappingAssetRole', () => {
        const existingRoles: AssetPartyRoleDto[] = [
            { id: '1', assetId: 'farm-1', partyId: 'party-1', role: 'OWNER', validFrom: '2026-01-01', validTo: '2026-06-30' }
        ];

        it('should detect overlap', () => {
            const candidate: AssetPartyRoleDto = { id: 'new', assetId: 'farm-1', partyId: 'party-1', role: 'OWNER', validFrom: '2026-06-01', validTo: '2026-12-31' };
            expect(hasOverlappingAssetRole(existingRoles, candidate)).toBe(true);
        });

        it('should allow non-overlapping dates', () => {
            const candidate: AssetPartyRoleDto = { id: 'new', assetId: 'farm-1', partyId: 'party-1', role: 'OWNER', validFrom: '2026-07-01', validTo: '2026-12-31' };
            expect(hasOverlappingAssetRole(existingRoles, candidate)).toBe(false);
        });

        it('should ignore other roles/assets', () => {
            const candidate: AssetPartyRoleDto = { id: 'new', assetId: 'farm-2', partyId: 'party-1', role: 'OWNER', validFrom: '2026-01-01', validTo: '2026-12-31' };
            expect(hasOverlappingAssetRole(existingRoles, candidate)).toBe(false);
        });
    });

    describe('hasOwnershipOrManagementCycle', () => {
        it('should detect a direct cycle', () => {
            const relations: any[] = [
                { fromPartyId: 'A', toPartyId: 'B', relationType: 'OWNERSHIP' },
                { fromPartyId: 'B', toPartyId: 'A', relationType: 'MANAGEMENT' }
            ];
            expect(hasOwnershipOrManagementCycle(relations)).toBe(true);
        });

        it('should detect complex cycle', () => {
            const relations: any[] = [
                { fromPartyId: 'A', toPartyId: 'B', relationType: 'OWNERSHIP' },
                { fromPartyId: 'B', toPartyId: 'C', relationType: 'OWNERSHIP' },
                { fromPartyId: 'C', toPartyId: 'A', relationType: 'OWNERSHIP' }
            ];
            expect(hasOwnershipOrManagementCycle(relations)).toBe(true);
        });

        it('should allow DAG (no cycles)', () => {
            const relations: any[] = [
                { fromPartyId: 'A', toPartyId: 'B', relationType: 'OWNERSHIP' },
                { fromPartyId: 'B', toPartyId: 'C', relationType: 'OWNERSHIP' }
            ];
            expect(hasOwnershipOrManagementCycle(relations)).toBe(false);
        });
    });
});
