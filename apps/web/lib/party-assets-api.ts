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
import { PartyLookupRequest, PartyLookupResponse } from '@/shared/types/party-lookup';

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
  lookupParty: async (data: PartyLookupRequest): Promise<PartyLookupResponse> => {
    const response = await apiClient.post<PartyLookupResponse>('/party-lookup', data);
    return response.data;
  },

  listParties: async (params?: PartiesQuery): Promise<PartyListItemVm[]> => {
    const response = await apiClient.get<PartyListItemVm[]>('/api/parties', { params });
    return response.data ?? [];
  },

  getParty: async (partyId: string): Promise<PartyDto> => {
    const response = await apiClient.get<PartyDto>(`/api/parties/${encodeURIComponent(partyId)}`);
    return response.data;
  },

  getPartyRelations: async (partyId: string): Promise<PartyRelationDto[]> => {
    const response = await apiClient.get<PartyRelationDto[]>(`/api/parties/${encodeURIComponent(partyId)}/relations`);
    return response.data ?? [];
  },

  getPartyAssets: async (partyId: string): Promise<PartyAssetsVm> => {
    const response = await apiClient.get<PartyAssetsVm>(`/api/parties/${encodeURIComponent(partyId)}/assets`);
    return response.data ?? { assets: [], roles: [] };
  },

  createParty: async (
    data: Omit<PartyDto, 'id' | 'status' | 'registrationData'> & {
      status?: PartyDto['status'];
      registrationData?: PartyRegistrationData;
    },
  ): Promise<PartyDto> => {
    const response = await apiClient.post<PartyDto>('/api/parties', data);
    return response.data;
  },

  createPartyRelation: async (data: Omit<PartyRelationDto, 'id'>): Promise<PartyRelationDto> => {
    const response = await apiClient.post<PartyRelationDto>('/api/party-relations', data);
    return response.data;
  },

  listFarms: async (params?: FarmsQuery): Promise<FarmListItemVm[]> => {
    const response = await apiClient.get<FarmListItemVm[]>('/api/assets/farms', { params });
    return response.data ?? [];
  },

  getFarm: async (farmId: string): Promise<FarmDto> => {
    const response = await apiClient.get<FarmDto>(`/api/assets/farms/${encodeURIComponent(farmId)}`);
    return response.data;
  },

  getFarmFields: async (farmId: string): Promise<AssetDto[]> => {
    const response = await apiClient.get<AssetDto[]>(`/api/assets/farms/${encodeURIComponent(farmId)}/fields`);
    return response.data ?? [];
  },

  createFarm: async (data: { name: string; regionCode?: string; status?: 'ACTIVE' | 'ARCHIVED' }): Promise<FarmDto> => {
    const response = await apiClient.post<FarmDto>('/api/assets/farms', data);
    return response.data;
  },

  getAssetRoles: async (assetId: string): Promise<AssetPartyRoleDto[]> => {
    const response = await apiClient.get<AssetPartyRoleDto[]>(`/api/assets/${encodeURIComponent(assetId)}/roles`);
    return response.data ?? [];
  },

  assignAssetRole: async (data: Omit<AssetPartyRoleDto, 'id'>): Promise<AssetPartyRoleDto> => {
    const response = await apiClient.post<AssetPartyRoleDto>(`/api/assets/${encodeURIComponent(data.assetId)}/roles`, data);
    return response.data;
  },

  listAssetsByType: async (type: 'FIELD' | 'OBJECT'): Promise<AssetDto[]> => {
    const response = await apiClient.get<AssetDto[]>(`/api/assets/${type.toLowerCase()}s`);
    return response.data ?? [];
  },
};
