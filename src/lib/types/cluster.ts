// Cluster Provider interfaces
export interface ClusterProvider {
  id: number;
  name: string;
  is_cloud: boolean;
}

export interface ClusterProviders {
  cluster_providers: ClusterProvider[];
}

// Cluster Status interfaces
export interface ClusterStatus {
  id: number;
  name: string;
}

export interface ClusterStatuses {
  cluster_statuses: ClusterStatus[];
}

// Cluster Level interfaces
export interface ClusterLevel {
  id: number;
  name: string;
}

export interface ClusterLevels {
  cluster_levels: ClusterLevel[];
}

// Node Status interfaces
export interface NodeStatus {
  id: number;
  name: string;
}

export interface NodeStatuses {
  node_statuses: NodeStatus[];
}

// Node Group Type interfaces
export interface NodeGroupType {
  id: number;
  name: string;
}

export interface NodeGroupTypes {
  node_group_types: NodeGroupType[];
}

// Node Role interfaces
export interface NodeRole {
  id: number;
  name: string;
}

export interface NodeRoles {
  node_roles: NodeRole[];
}

// Resource Type interfaces
export interface ResourceType {
  id: number;
  name: string;
}

export interface ResourceTypes {
  resource_types: ResourceType[];
}

// Region interfaces
export interface Region {
  id: string;
  name: string;
}

export interface Regions {
  regions: Region[];
}

// Cluster Save Args interface
export interface ClusterSaveArgs {
  id?: number; // optional
  name: string; // required
  provider: 'baremetal' | 'aws' | 'ali_cloud'; // required
  public_key: string; // required
  private_key: string; // required
  access_id?: string; // optional
  access_key?: string; // optional
  region?: string; // optional
  node_username?: string; // optional
  node_start_ip?: string; // optional
  node_end_ip?: string; // optional
}

// Cluster Region Args interface
export interface ClusterRegionArgs {
  access_id: string; // required
  access_key: string; // required
  provider: 'baremetal' | 'aws' | 'ali_cloud'; // required
}

// Cluster ID Args interface
export interface ClusterIdArgs {
  id: number; // required
}

// Cluster List Args interface
export interface ClusterListArgs {
  name?: string; // optional
  page?: number; // default is 1
  page_size?: number; // default is 10, max is 100
}

// Node Group interface
export interface NodeGroup {
  id: string;
  name: string;
  type:
    | 'normal'
    | 'high_computation'
    | 'gpu_accelerated'
    | 'high_memory'
    | 'large_hard_disk'
    | 'load_disk'
    | 'unspecified';
  os: string;
  arch: string;
  cpu: number;
  memory: number;
  gpu: number;
  gpu_spec: string;
  system_disk_size: number;
  data_disk_size: number;
  min_size: number;
  max_size: number;
  target_size: number;
}

// Node interface
export interface Node {
  id: number;
  ip: string;
  name: string;
  user: string;
  role: 'master' | 'worker' | 'edge' | 'unspecified';
  status:
    | 'node_ready'
    | 'node_finding'
    | 'node_creating'
    | 'node_pending'
    | 'node_running'
    | 'node_deleting'
    | 'node_deleted'
    | 'node_error'
    | 'unspecified';
  instance_id: string;
}

// Cluster Resource interface
export interface ClusterResource {
  cpu: number;
  memory: number;
  gpu: number;
  disk: number;
}

// Main Cluster interface
export interface Cluster {
  id: number;
  name: string;
  api_server_address: string;
  status:
    | 'unspecified'
    | 'starting'
    | 'running'
    | 'stopping'
    | 'stopped'
    | 'deleted'
    | 'error';
  level: 'basic' | 'standard' | 'advanced' | 'unspecified';
  domain: string;
  node_number: number;
  provider: string;
  region: string;
  node_username: string;
  node_start_ip: string;
  node_end_ip: string;
  nodes: Node[];
  node_groups: NodeGroup[];
  cluster_resource: ClusterResource;
}

// Cluster List interface
export interface ClusterList {
  clusters: Cluster[];
  total: number;
}
