import { ResourceQuota } from '@/lib/types/common';

// WorkspaceDetailParam interface
export interface WorkspaceDetailParam {
  id: number;
}

// WorkspaceListParam interface
export interface WorkspaceListParam {
  workspace_name: string;
  page: number;
  size: number;
}

// WorkspaceClusterRelationship interface
export interface WorkspaceClusterRelationship {
  id: number;
  workspace_id: number;
  cluster_id: number;
}

// Workspace interface
export interface Workspace {
  id: number;
  name: string;
  description: string;
  user_id: number;
  resource_quota: ResourceQuota;
  git_repository: string;
  image_repository: string;
  status: 'creating' | 'active' | 'inactive' | 'deleting' | 'unknown';
  cluster_relationships: WorkspaceClusterRelationship[];
}

// WorkspaceList interface
export interface WorkspaceList {
  total: number;
  items: Workspace[];
}
