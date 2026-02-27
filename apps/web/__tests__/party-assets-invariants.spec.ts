import {
  canActivateFarm,
  hasOverlappingAssetRole,
  hasOwnershipOrManagementCycle,
  validateOwnershipRelation,
} from '@/shared/lib/party-assets-invariants';
import { AssetPartyRoleDto, PartyRelationDto } from '@/shared/types/party-assets';

describe('party-assets invariants', () => {
  it('запрещает пересечение одинаковой роли по asset+party+role', () => {
    const existing: AssetPartyRoleDto[] = [
      {
        id: 'r1',
        assetId: 'farm-1',
        partyId: 'party-1',
        role: 'OPERATOR',
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
      },
    ];

    const candidate: AssetPartyRoleDto = {
      id: 'r2',
      assetId: 'farm-1',
      partyId: 'party-1',
      role: 'OPERATOR',
      validFrom: '2026-06-01',
      validTo: '2027-06-01',
    };

    expect(hasOverlappingAssetRole(existing, candidate)).toBe(true);
  });

  it('требует минимум один активный OPERATOR для активации FARM', () => {
    const noOperator: AssetPartyRoleDto[] = [
      {
        id: 'r1',
        assetId: 'farm-1',
        partyId: 'party-1',
        role: 'OWNER',
        validFrom: '2026-01-01',
      },
    ];

    expect(canActivateFarm(noOperator, '2026-02-01').ok).toBe(false);

    const withOperator: AssetPartyRoleDto[] = [
      ...noOperator,
      {
        id: 'r2',
        assetId: 'farm-1',
        partyId: 'party-2',
        role: 'OPERATOR',
        validFrom: '2026-01-01',
      },
    ];

    expect(canActivateFarm(withOperator, '2026-02-01').ok).toBe(true);
  });

  it('запрещает OWNERSHIP без sharePct и детектит цикл', () => {
    const invalidOwnership: PartyRelationDto = {
      id: 'rel-1',
      fromPartyId: 'a',
      toPartyId: 'b',
      relationType: 'OWNERSHIP',
      validFrom: '2026-01-01',
    };

    expect(validateOwnershipRelation(invalidOwnership)).toContain('доля');

    const cyclic: PartyRelationDto[] = [
      {
        id: 'rel-2',
        fromPartyId: 'a',
        toPartyId: 'b',
        relationType: 'OWNERSHIP',
        sharePct: 50,
        validFrom: '2026-01-01',
      },
      {
        id: 'rel-3',
        fromPartyId: 'b',
        toPartyId: 'a',
        relationType: 'MANAGEMENT',
        validFrom: '2026-01-01',
      },
    ];

    expect(hasOwnershipOrManagementCycle(cyclic)).toBe(true);
  });
});
