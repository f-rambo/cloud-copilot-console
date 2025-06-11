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

// ResourceLimit interface
export interface ResourceLimit {
  request: number;
  limit: number;
}

// ResourceQuota interface
export interface ResourceQuota {
  cpu: ResourceLimit;
  memory: ResourceLimit;
  gpu: ResourceLimit;
  storage: ResourceLimit;
  pods: ResourceLimit;
}

// WorkspaceClusterRelationship interface
export interface WorkspaceClusterRelationship {
  id: number;
  workspace_id: number;
  cluster_id: number;
  permissions: 'read' | 'write' | 'admin' | 'unknown';
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
