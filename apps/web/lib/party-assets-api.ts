import { apiClient, buildIdempotencyKey, serializeIdempotencyPayload } from '@/lib/api';
import {
  AssetDto,
  AssetPartyRoleDto,
  FarmDto,
  FarmListItemVm,
  PartyAssetsVm,
  PartyDto,
  PartyListItemVm,
  PartyRegistrationData,
  PartyRelationDto,
} from '@/shared/types/party-assets';
import { BankLookupResponse, PartyIdentificationSchema, PartyLookupRequest, PartyLookupResponse } from '@/shared/types/party-lookup';
import { normalizePartyDto, normalizePartyListItem } from '@/shared/lib/party-normalizers';

function normalizeRelationType(value: unknown): PartyRelationDto['relationType'] {
  switch (value) {
    case 'OWNERSHIP':
      return 'OWNERSHIP';
    case 'AFFILIATION':
      return 'AFFILIATED';
    case 'COMMERCIAL':
      return 'MANAGEMENT';
    case 'MANAGEMENT':
      return 'MANAGEMENT';
    case 'AFFILIATED':
      return 'AFFILIATED';
    case 'AGENCY':
      return 'AGENCY';
    default:
      return 'AFFILIATED';
  }
}

function toBackendRelationType(value: PartyRelationDto['relationType']): string {
  switch (value) {
    case 'OWNERSHIP':
      return 'OWNERSHIP';
    case 'AFFILIATED':
      return 'AFFILIATED';
    case 'MANAGEMENT':
      return 'MANAGEMENT';
    case 'AGENCY':
      return 'AGENCY';
    default:
      return value;
  }
}

export interface PartiesQuery {
  type?: string;
  jurisdictionId?: string;
  q?: string;
}

export interface FarmsQuery {
  q?: string;
  holdingId?: string;
  operatorId?: string;
  hasLease?: boolean;
}

export interface CreateFrontOfficeInvitationPayload {
  partyId: string;
  accountId?: string;
  partyContactId?: string;
  telegramId: string;
  proposedLogin?: string;
  fullName?: string;
  position?: string;
  phone?: string;
  email?: string;
}

export interface FrontOfficeInvitationResponse {
  invitation: {
    id: string;
    token: string;
    shortCode: string;
    status: string;
    expiresAt: string;
    telegramId: string;
    partyId: string;
    accountId: string;
    partyContactId?: string | null;
    proposedLogin?: string | null;
  };
  counterparty: {
    id: string;
    name: string;
  };
  account: {
    id: string;
    name: string;
  };
  contact: {
    partyContactId?: string | null;
    fullName?: string | null;
    position?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  links: {
    activationUrl: string;
    botStartLink?: string | null;
  };
  delivery: {
    delivered: boolean;
    reason?: string;
  };
}

export const partyAssetsApi = {
  getIdentificationSchema: async (jurisdictionId: string, partyType: string): Promise<PartyIdentificationSchema> => {
    const response = await apiClient.get<PartyIdentificationSchema>(
      `/jurisdictions/${encodeURIComponent(jurisdictionId)}/identification-schema`,
      { params: { partyType } },
    );
    return response.data;
  },

  lookupParty: async (data: PartyLookupRequest): Promise<PartyLookupResponse> => {
    const response = await apiClient.post<PartyLookupResponse>('/party-lookup', data);
    return response.data;
  },

  lookupBankByBic: async (bic: string): Promise<BankLookupResponse> => {
    const response = await apiClient.post<BankLookupResponse>('/bank-lookup', { bic });
    return response.data;
  },

  listParties: async (params?: PartiesQuery): Promise<PartyListItemVm[]> => {
    const response = await apiClient.get<PartyListItemVm[]>('/parties', { params });
    return Array.isArray(response.data) ? response.data.map((item) => normalizePartyListItem(item)) : [];
  },

  getParty: async (partyId: string): Promise<PartyDto> => {
    const response = await apiClient.get<PartyDto>(`/parties/${encodeURIComponent(partyId)}`);
    return normalizePartyDto(response.data);
  },

  getPartyRelations: async (partyId: string): Promise<PartyRelationDto[]> => {
    const response = await apiClient.get<PartyRelationDto[]>(`/parties/${encodeURIComponent(partyId)}/relations`);
    return Array.isArray(response.data)
      ? response.data.map((item: any) => ({
          id: String(item.id ?? ''),
          fromPartyId: String(item.fromPartyId ?? item.sourcePartyId ?? ''),
          toPartyId: String(item.toPartyId ?? item.targetPartyId ?? ''),
          relationType: normalizeRelationType(item.relationType),
          fromPartyName: typeof item.sourceParty?.legalName === 'string' ? item.sourceParty.legalName : undefined,
          toPartyName: typeof item.targetParty?.legalName === 'string' ? item.targetParty.legalName : undefined,
          sharePct: item.sharePct,
          validFrom: item.validFrom,
          validTo: item.validTo,
          basisDocId: item.basisDocId,
        }))
      : [];
  },

  getPartyAssets: async (partyId: string): Promise<PartyAssetsVm> => {
    try {
      const response = await apiClient.get<PartyAssetsVm>(`/parties/${encodeURIComponent(partyId)}/assets`);
      return response.data ?? { assets: [], roles: [] };
    } catch {
      return { assets: [], roles: [] };
    }
  },

  createParty: async (
    data: Omit<PartyDto, 'id' | 'status' | 'registrationData'> & {
      status?: PartyDto['status'];
      registrationData?: PartyRegistrationData;
    },
  ): Promise<PartyDto> => {
    const response = await apiClient.post<PartyDto>('/parties', {
      type: data.type,
      legalName: data.legalName,
      shortName: data.shortName,
      jurisdictionId: data.jurisdictionId,
      status: data.status,
      comment: data.comment,
      registrationData: data.registrationData,
    }, {
      headers: {
        'Idempotency-Key': buildIdempotencyKey('party-assets-party-create', [
          data.type,
          data.legalName,
          data.jurisdictionId,
        ]),
      },
    });
    return normalizePartyDto(response.data);
  },

  updateParty: async (
    partyId: string,
    data: Partial<Omit<PartyDto, 'id' | 'registrationData'>> & {
      registrationData?: PartyRegistrationData | null;
      regulatoryProfileId?: string | null;
    },
  ): Promise<PartyDto> => {
    const response = await apiClient.patch<PartyDto>(`/commerce/parties/${encodeURIComponent(partyId)}`, {
      type: data.type,
      legalName: data.legalName,
      shortName: data.shortName,
      jurisdictionId: data.jurisdictionId,
      status: data.status,
      comment: data.comment,
      regulatoryProfileId: data.regulatoryProfileId,
      registrationData: data.registrationData,
    }, {
      headers: {
        'Idempotency-Key': buildIdempotencyKey('party-assets-party-update', [
          partyId,
          serializeIdempotencyPayload(data),
        ]),
      },
    });
    return normalizePartyDto(response.data);
  },

  createFrontOfficeInvitation: async (
    data: CreateFrontOfficeInvitationPayload,
  ): Promise<FrontOfficeInvitationResponse> => {
    const response = await apiClient.post<FrontOfficeInvitationResponse>(
      '/auth/front-office/invitations',
      data,
      {
        headers: {
          'Idempotency-Key': buildIdempotencyKey('party-front-office-invite', [
            data.partyId,
            data.partyContactId ?? null,
            data.telegramId,
            data.proposedLogin ?? null,
          ]),
        },
      },
    );

    return response.data;
  },

  createPartyRelation: async (data: Omit<PartyRelationDto, 'id'>): Promise<PartyRelationDto> => {
    const response = await apiClient.post<PartyRelationDto>('/party-relations', {
      fromPartyId: data.fromPartyId,
      toPartyId: data.toPartyId,
      relationType: toBackendRelationType(data.relationType),
      sharePct: data.sharePct,
      validFrom: data.validFrom,
      validTo: data.validTo,
      basisDocId: data.basisDocId,
    }, {
      headers: {
        'Idempotency-Key': buildIdempotencyKey('party-assets-relation-create', [
          data.fromPartyId,
          data.toPartyId,
          data.relationType,
          data.validFrom,
        ]),
      },
    });
    return {
      id: String((response.data as any)?.id ?? ''),
      fromPartyId: String((response.data as any)?.fromPartyId ?? (response.data as any)?.sourcePartyId ?? data.fromPartyId),
      toPartyId: String((response.data as any)?.toPartyId ?? (response.data as any)?.targetPartyId ?? data.toPartyId),
      relationType: normalizeRelationType((response.data as any)?.relationType ?? data.relationType),
      fromPartyName: typeof (response.data as any)?.sourceParty?.legalName === 'string' ? (response.data as any).sourceParty.legalName : undefined,
      toPartyName: typeof (response.data as any)?.targetParty?.legalName === 'string' ? (response.data as any).targetParty.legalName : undefined,
      sharePct: data.sharePct,
      validFrom: (response.data as any)?.validFrom ?? data.validFrom,
      validTo: (response.data as any)?.validTo ?? data.validTo,
      basisDocId: data.basisDocId,
    };
  },

  updatePartyRelation: async (relationId: string, data: Partial<Omit<PartyRelationDto, 'id'>>): Promise<PartyRelationDto> => {
    const response = await apiClient.patch(`/party-relations/${encodeURIComponent(relationId)}`, data, {
      headers: {
        'Idempotency-Key': buildIdempotencyKey('party-assets-relation-update', [
          relationId,
          serializeIdempotencyPayload(data),
        ]),
      },
    });
    return {
      id: String((response.data as any)?.id ?? relationId),
      fromPartyId: String((response.data as any)?.fromPartyId ?? (response.data as any)?.sourcePartyId ?? data.fromPartyId ?? ''),
      toPartyId: String((response.data as any)?.toPartyId ?? (response.data as any)?.targetPartyId ?? data.toPartyId ?? ''),
      relationType: normalizeRelationType((response.data as any)?.relationType ?? data.relationType),
      fromPartyName: typeof (response.data as any)?.sourceParty?.legalName === 'string' ? (response.data as any).sourceParty.legalName : undefined,
      toPartyName: typeof (response.data as any)?.targetParty?.legalName === 'string' ? (response.data as any).targetParty.legalName : undefined,
      sharePct: (response.data as any)?.sharePct ?? data.sharePct,
      validFrom: (response.data as any)?.validFrom ?? data.validFrom ?? '',
      validTo: (response.data as any)?.validTo ?? data.validTo,
      basisDocId: (response.data as any)?.basisDocId ?? data.basisDocId,
    };
  },

  deletePartyRelation: async (relationId: string): Promise<void> => {
    await apiClient.delete(`/party-relations/${encodeURIComponent(relationId)}`);
  },

  listFarms: async (params?: FarmsQuery): Promise<FarmListItemVm[]> => {
    const response = await apiClient.get<FarmListItemVm[]>('/assets/farms', { params });
    return response.data ?? [];
  },

  getFarm: async (farmId: string): Promise<FarmDto> => {
    const response = await apiClient.get<FarmDto>(`/assets/farms/${encodeURIComponent(farmId)}`);
    return response.data;
  },

  getFarmFields: async (farmId: string): Promise<AssetDto[]> => {
    const response = await apiClient.get<AssetDto[]>(`/assets/farms/${encodeURIComponent(farmId)}/fields`);
    return response.data ?? [];
  },

  createFarm: async (data: { name: string; regionCode?: string; status?: 'ACTIVE' | 'ARCHIVED' }): Promise<FarmDto> => {
    const response = await apiClient.post<FarmDto>('/assets/farms', data, {
      headers: {
        'Idempotency-Key': buildIdempotencyKey('party-assets-farm-create', [
          data.name,
          data.regionCode ?? null,
          data.status ?? null,
        ]),
      },
    });
    return response.data;
  },

  getAssetRoles: async (assetId: string): Promise<AssetPartyRoleDto[]> => {
    const response = await apiClient.get<AssetPartyRoleDto[]>(`/assets/${encodeURIComponent(assetId)}/roles`);
    return response.data ?? [];
  },

  assignAssetRole: async (data: Omit<AssetPartyRoleDto, 'id'>): Promise<AssetPartyRoleDto> => {
    const response = await apiClient.post<AssetPartyRoleDto>(`/assets/${encodeURIComponent(data.assetId)}/roles`, data, {
      headers: {
        'Idempotency-Key': buildIdempotencyKey('party-assets-role-create', [
          data.assetId,
          data.partyId,
          data.role,
          data.validFrom,
        ]),
      },
    });
    return response.data;
  },

  updateAssetRole: async (
    assetId: string,
    roleId: string,
    data: Partial<Omit<AssetPartyRoleDto, 'id' | 'assetId' | 'partyId'>>,
  ): Promise<AssetPartyRoleDto> => {
    const response = await apiClient.patch<AssetPartyRoleDto>(
      `/assets/${encodeURIComponent(assetId)}/roles/${encodeURIComponent(roleId)}`,
      data,
      {
        headers: {
          'Idempotency-Key': buildIdempotencyKey('party-assets-role-update', [
            assetId,
            roleId,
            serializeIdempotencyPayload(data),
          ]),
        },
      },
    );
    return response.data;
  },

  deleteAssetRole: async (assetId: string, roleId: string): Promise<void> => {
    await apiClient.delete(`/assets/${encodeURIComponent(assetId)}/roles/${encodeURIComponent(roleId)}`);
  },

  listAssetsByType: async (type: 'FIELD' | 'OBJECT'): Promise<AssetDto[]> => {
    const response = await apiClient.get<AssetDto[]>(`/assets/${type.toLowerCase()}s`);
    return response.data ?? [];
  },
};
