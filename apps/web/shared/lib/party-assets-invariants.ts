import { AssetPartyRoleDto, PartyRelationDto } from '@/shared/types/party-assets';

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function overlaps(aFrom: string, aTo: string | undefined, bFrom: string, bTo: string | undefined): boolean {
  const fromA = toDate(aFrom).getTime();
  const toA = aTo ? toDate(aTo).getTime() : Number.POSITIVE_INFINITY;
  const fromB = toDate(bFrom).getTime();
  const toB = bTo ? toDate(bTo).getTime() : Number.POSITIVE_INFINITY;
  return fromA <= toB && fromB <= toA;
}

export function validateDateRange(validFrom: string, validTo?: string): string | null {
  if (!validTo) {
    return null;
  }
  return toDate(validFrom).getTime() < toDate(validTo).getTime()
    ? null
    : 'Дата начала должна быть раньше даты окончания.';
}

export function validateOwnershipRelation(relation: PartyRelationDto): string | null {
  if (relation.relationType === 'OWNERSHIP') {
    if (typeof relation.sharePct !== 'number' || relation.sharePct <= 0 || relation.sharePct > 100) {
      return 'Для связи владения доля должна быть в диапазоне (0..100].';
    }
  }
  return validateDateRange(relation.validFrom, relation.validTo);
}

export function hasOverlappingAssetRole(
  existingRoles: AssetPartyRoleDto[],
  candidate: AssetPartyRoleDto,
): boolean {
  return existingRoles.some((current) => {
    if (
      current.assetId !== candidate.assetId ||
      current.partyId !== candidate.partyId ||
      current.role !== candidate.role ||
      current.id === candidate.id
    ) {
      return false;
    }

    return overlaps(current.validFrom, current.validTo, candidate.validFrom, candidate.validTo);
  });
}

export function hasActiveOperator(roles: AssetPartyRoleDto[], asOf: string): boolean {
  return roles.some((role) => {
    if (role.role !== 'OPERATOR') {
      return false;
    }
    return overlaps(role.validFrom, role.validTo, asOf, asOf);
  });
}

export function canActivateFarm(roles: AssetPartyRoleDto[], asOf: string): { ok: boolean; reason?: string } {
  if (!hasActiveOperator(roles, asOf)) {
    return { ok: false, reason: 'Для активации хозяйства требуется минимум один активный оператор.' };
  }
  return { ok: true };
}

export function hasOwnershipOrManagementCycle(relations: PartyRelationDto[]): boolean {
  const graph = new Map<string, Set<string>>();

  relations
    .filter((relation) => relation.relationType === 'OWNERSHIP' || relation.relationType === 'MANAGEMENT')
    .forEach((relation) => {
      const edges = graph.get(relation.fromPartyId) ?? new Set<string>();
      edges.add(relation.toPartyId);
      graph.set(relation.fromPartyId, edges);
      if (!graph.has(relation.toPartyId)) {
        graph.set(relation.toPartyId, new Set<string>());
      }
    });

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): boolean => {
    if (visiting.has(node)) {
      return true;
    }
    if (visited.has(node)) {
      return false;
    }

    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      if (dfs(next)) {
        return true;
      }
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };

  for (const node of graph.keys()) {
    if (dfs(node)) {
      return true;
    }
  }

  return false;
}
