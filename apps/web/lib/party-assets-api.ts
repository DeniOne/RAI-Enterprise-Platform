import { apiClient } from '@/lib/api';
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
import { PartyIdentificationSchema, PartyLookupRequest, PartyLookupResponse } from '@/shared/types/party-lookup';
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
    });
    return normalizePartyDto(response.data);
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
    });
    return {
      id: String((response.data as any)?.id ?? ''),
      fromPartyId: String((response.data as any)?.fromPartyId ?? (response.data as any)?.sourcePartyId ?? data.fromPartyId),
      toPartyId: String((response.data as any)?.toPartyId ?? (response.data as any)?.targetPartyId ?? data.toPartyId),
      relationType: normalizeRelationType((response.data as any)?.relationType ?? data.relationType),
      sharePct: data.sharePct,
      validFrom: (response.data as any)?.validFrom ?? data.validFrom,
      validTo: (response.data as any)?.validTo ?? data.validTo,
      basisDocId: data.basisDocId,
    };
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
    const response = await apiClient.post<FarmDto>('/assets/farms', data);
    return response.data;
  },

  getAssetRoles: async (assetId: string): Promise<AssetPartyRoleDto[]> => {
    const response = await apiClient.get<AssetPartyRoleDto[]>(`/assets/${encodeURIComponent(assetId)}/roles`);
    return response.data ?? [];
  },

  assignAssetRole: async (data: Omit<AssetPartyRoleDto, 'id'>): Promise<AssetPartyRoleDto> => {
    const response = await apiClient.post<AssetPartyRoleDto>(`/assets/${encodeURIComponent(data.assetId)}/roles`, data);
    return response.data;
  },

  listAssetsByType: async (type: 'FIELD' | 'OBJECT'): Promise<AssetDto[]> => {
    const response = await apiClient.get<AssetDto[]>(`/api/assets/${type.toLowerCase()}s`);
    return response.data ?? [];
  },
};
