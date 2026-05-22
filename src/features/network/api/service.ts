import { apiClient } from '@/lib/api-client';
import type { NetworkResponse, NetworkTreeMember, NetworkMember } from './types';
import networkData from '@/constants/json/network.json';

export async function getNetworkData(token: string): Promise<NetworkResponse> {
  try {
    return await apiClient<NetworkResponse>('/user/network', {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    // Offline / Demo high-fidelity fallback data loaded from cleanly separated JSON file
    return {
      members: networkData.members as unknown as NetworkMember[],
      referralLink: networkData.referralLink,
      stats: networkData.stats
    };
  }
}

export async function getNetworkTree(token: string): Promise<NetworkTreeMember> {
  try {
    return await apiClient<NetworkTreeMember>('/user/network/tree', {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    // Offline / Demo high-fidelity fallback hierarchical tree node loaded from cleanly separated JSON file
    return networkData.tree as unknown as NetworkTreeMember;
  }
}
