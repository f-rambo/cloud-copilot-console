import { ResourceQuota } from '@/lib/types/common';

// service ServiceInterface {
//       rpc List(ServicesRequest) returns (Services) {
//             option (google.api.http) = {
//               get: "/api/v1alpha1/service/list"
//             };
//       }

//       rpc Save(Service) returns (common.Msg) {
//             option (google.api.http) = {
//               post: "/api/v1alpha1/service/save"
//               body: "*"
//             };
//       }

//       rpc Get(ServiceDetailIdRequest) returns (Service) {
//             option (google.api.http) = {
//               get: "/api/v1alpha1/service/get"
//             };
//       }

//       rpc Delete(ServiceDetailIdRequest) returns (common.Msg) {
//             option (google.api.http) = {
//               delete: "/api/v1alpha1/service/delete"
//             };
//       }

//       rpc SaveServiceWorkflow(Workflow) returns(common.Msg) {
//             option (google.api.http) = {
//               post: "/api/v1alpha1/service/workflow"
//               body: "*"
//             };
//       }

//       rpc GetServiceWorkflow(GetServiceWorkflowRequest) returns(Workflow) {
//             option (google.api.http) = {
//               get: "/api/v1alpha1/service/workflow"
//             };
//       }

//       rpc CreateContinuousIntegration(ContinuousIntegration) returns(common.Msg) {
//             option (google.api.http) = {
//               post: "/api/v1alpha1/service/continuousintegration"
//               body: "*"
//             };
//       }

//       rpc GetContinuousIntegration(ContinuousIntegrationDetailRequest) returns(ContinuousIntegration) {
//             option (google.api.http) = {
//               get: "/api/v1alpha1/service/continuousintegration"
//             };
//       }

//       rpc GetContinuousIntegrations(ContinuousIntegrationsRequest) returns(ContinuousIntegrations) {
//             option (google.api.http) = {
//               get: "/api/v1alpha1/service/continuousintegrations"
//             };
//       }

//       rpc DeleteContinuousIntegration(ContinuousIntegrationDetailRequest) returns(common.Msg) {
//             option (google.api.http) = {
//               delete: "/api/v1alpha1/service/continuousintegration"
//             };
//       }

//       rpc CreateContinuousDeployment(ContinuousDeployment) returns(common.Msg) {
//             option (google.api.http) = {
//               post: "/api/v1alpha1/service/continuousdeployment"
//               body: "*"
//             };
//       }

//       rpc GetContinuousDeployment(ContinuousDeploymentDetailRequest) returns(ContinuousDeployment) {
//             option (google.api.http) = {
//               get: "/api/v1alpha1/service/continuousdeployment"
//             };
//       }

//       rpc GetContinuousDeployments(ContinuousDeploymentsRequest) returns(ContinuousDeployments) {
//             option (google.api.http) = {
//               get: "/api/v1alpha1/service/continuousdeployments"
//             };
//       }

//       rpc DeleteContinuousDeployment(ContinuousDeploymentDetailRequest) returns(common.Msg) {
//             option (google.api.http) = {
//               delete: "/api/v1alpha1/service/continuousdeployment"
//             };
//       }

//       rpc ApplyService(ApplyServiceRequest) returns(common.Msg) {
//             option (google.api.http) = {
//               post: "/api/v1alpha1/service/apply"
//               body: "*"
//             };
//       }
// }

// ServicesRequest interface
export interface ServicesRequest {
  name?: string;
  page?: number;
  size?: number;
  project_id?: number;
}

// ServiceDetailIdRequest interface
export interface ServiceDetailIdRequest {
  id: number;
}

// Services interface
export interface Services {
  services: Service[];
  total: number;
}

// Service interface
export interface Service {
  id: number;
  name: string;
  labels: string;
  resource_quota: ResourceQuota;
  ports: Port[];
  volumes: Volume[];
  pods: Pod[];
  description: string;
  user_id: number;
  project_id: number;
  workspace_id: number;
  cluster_id: number;
}

// Port interface
export interface Port {
  id: number;
  name: string;
  path: string;
  protocol: 'TCP' | 'UDP';
  container_port: number;
}

// Volume interface
export interface Volume {
  id: number;
  name: string;
  mount_path: string;
  storage: number;
  storage_class: string;
}

// Pod interface
export interface Pod {
  id: number;
  name: string;
  node_name: string;
  status: string;
}

// GetServiceWorkflowRequest interface
export interface GetServiceWorkflowRequest {
  service_id: number;
  workflow_type: string;
}

// Workflow interface
export interface Workflow {
  id: number;
  name: string;
  namespace: string;
  workflow_type: string;
  description: string;
  service_id: number;
  workflow_steps: WorkflowStep[];
}

// WorkflowStep interface
export interface WorkflowStep {
  id: number;
  workflow_id: number;
  order: number;
  name: string;
  description: string;
  workflow_tasks: WorkflowTask[];
}

// WorkflowTask interface
export interface WorkflowTask {
  id: number;
  workflow_id: number;
  step_id: number;
  name: string;
  order: number;
  task: string;
  description: string;
  status: string;
}

// ContinuousIntegrationsRequest interface
export interface ContinuousIntegrationsRequest {
  service_id?: number;
  version?: string;
  page: number;
  page_size: number;
}

// ContinuousIntegrations interface
export interface ContinuousIntegrations {
  continuous_integrations: ContinuousIntegration[];
  total: number;
}

// ContinuousIntegrationDetailRequest interface
export interface ContinuousIntegrationDetailRequest {
  id: number;
}

// ContinuousIntegration interface
export interface ContinuousIntegration {
  id: number;
  version: string;
  branch: string;
  tag: string;
  status: string;
  description: string;
  service_id: number;
  user_id: number;
  workflow: Workflow;
  logs: string;
}

// ContinuousDeploymentsRequest interface
export interface ContinuousDeploymentsRequest {
  service_id?: number;
  ci_id?: number;
  page: number;
  page_size: number;
}

// ContinuousDeployments interface
export interface ContinuousDeployments {
  continuous_deployments: ContinuousDeployment[];
  total: number;
}

// ContinuousDeploymentDetailRequest interface
export interface ContinuousDeploymentDetailRequest {
  id: number;
}

// ContinuousDeployment interface
export interface ContinuousDeployment {
  id: number;
  ci_id: number;
  service_id: number;
  user_id: number;
  status: string;
  workflow: Workflow;
  config_path: string;
  config: string;
  logs: string;
}

// ApplyServiceRequest interface
export interface ApplyServiceRequest {
  service_id: number;
  ci_id: number;
  cd_id: number;
}
