import { ResourceQuota } from '@/lib/types/common';

// service ProjectService {
//       rpc Save(Project) returns (common.Msg) {
//             option (google.api.http) = {
//                   post: "/api/v1alpha1/project"
//                   body: "*"
//             };
//       }

//       rpc Get(ProjectDetailRequest) returns (Project) {
//             option (google.api.http) = {
//                   get: "/api/v1alpha1/project"
//             };
//       }

//       rpc List(ProjectsReqquest) returns (Projects) {
//             option (google.api.http) = {
//                   get: "/api/v1alpha1/project/list"
//             };
//       }

//       rpc Delete(ProjectDetailRequest) returns (common.Msg) {
//             option (google.api.http) = {
//                   delete: "/api/v1alpha1/project"
//             };
//       }
// }

// ProjectsRequest接口
export interface ProjectsRequest {
  name?: string;
  page?: number;
  size?: number;
}

// Project接口
export interface Project {
  id: number;
  name: string;
  description: string;
  user_id: number;
  workspace_id: number;
  resource_quota: ResourceQuota;
}

// Projects接口
export interface Projects {
  total: number;
  projects: Project[];
}

// ProjectDetailRequest接口
export interface ProjectDetailRequest {
  id: number;
}
