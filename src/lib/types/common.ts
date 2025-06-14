// ResourceLimit interface
export interface ResourceLimit {
  request: number;
  limit: number;
  used: number;
}

// ResourceQuota interface
export interface ResourceQuota {
  replicas: number;
  cpu: ResourceLimit;
  memory: ResourceLimit;
  gpu: ResourceLimit;
  storage: ResourceLimit;
  pods: ResourceLimit;
}
