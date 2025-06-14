// server grpc api
// service UserInterface {
//   rpc SignIn(SignInRequest) returns (User) {
//         option (google.api.http) = {
//           post: "/api/v1alpha1/user/signin"
//           body: "*"
//         };
//   }

//   rpc GetUsers(UsersRequest) returns (Users) {
//         option (google.api.http) = {
//           get: "/api/v1alpha1/users"
//         };
//   }

//   rpc SaveUser(User) returns (common.Msg) {
//         option (google.api.http) = {
//           post: "/api/v1alpha1/user"
//           body: "*"
//         };
//   }

//   rpc DeleteUser(User) returns (common.Msg) {
//         option (google.api.http) = {
//           delete: "/api/v1alpha1/user"
//         };
//   }

//   // Enable user
//   rpc EnableUser(UserIdRequest) returns (common.Msg) {
//         option (google.api.http) = {
//           post: "/api/v1alpha1/user/enable"
//           body: "*"
//         };
//   }

//   // Disable user
//   rpc DisableUser(UserIdRequest) returns (common.Msg) {
//         option (google.api.http) = {
//           post: "/api/v1alpha1/user/disable"
//           body: "*"
//         };
//   }

//   // save role
//   rpc SaveRole(Role) returns (common.Msg) {
//         option (google.api.http) = {
//           post: "/api/v1alpha1/role"
//           body: "*"
//         };
//   }

//   // get role
//   rpc GetRoles(RolesRequest) returns (Roles) {
//         option (google.api.http) = {
//           get: "/api/v1alpha1/roles"
//         };
//   }

//   // get one role
//   rpc GetRole(RoleIdRequest) returns (Role) {
//         option (google.api.http) = {
//           get: "/api/v1alpha1/role"
//         };
//   }

//   // delete role
//   rpc DeleteRole(RoleIdRequest) returns (common.Msg) {
//         option (google.api.http) = {
//           delete: "/api/v1alpha1/role"
//         };
//   }

// }

// 登录请求接口
export interface SignInRequest {
  email: string;
  password: string;
}

// 用户列表请求接口
export interface UsersRequest {
  page_size: number;
  page_number: number;
  username?: string;
  email?: string;
}

// 用户列表响应接口
export interface Users {
  users: User[];
  total_count: number;
}

// 用户ID请求接口
export interface UserIdRequest {
  user_id: number;
}

// 用户信息接口
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  token: string;
  status:
    | 'USER_INIT'
    | 'USER_ENABLE'
    | 'USER_DISABLE'
    | 'USER_DELETED'
    | 'UNKNOWN';
  expires: string;
  phone: string;
  department: string;
  workspace_roles: WorkspaceRole[];
}

// 工作空间角色接口
export interface WorkspaceRole {
  id: number;
  workspace_id: number;
  user_id: number;
  role_id: number;
}

// 角色列表请求接口
export interface RolesRequest {
  name?: string;
  page_size: number;
  page_number: number;
}

// 角色列表响应接口
export interface Roles {
  total_count: number;
  roles: Role[];
}

// 角色ID请求接口
export interface RoleIdRequest {
  role_id: number;
}

// 角色信息接口
export interface Role {
  id: number;
  name: string;
  verbs: string;
  resources: string;
  description: string;
  workspace_id: number;
  role_type:
    | 'SYSTEM_ADMIN'
    | 'WORKSPACE_ADMIN'
    | 'PROJECT_ADMIN'
    | 'DEVELOPER'
    | 'VIEWER'
    | 'CUSTOM'
    | 'UNKNOWN';
  permissions: Permission[];
}

// 权限信息接口
export interface Permission {
  id: number;
  role_resource_type:
    | 'CLUSTER'
    | 'WORKSPACE'
    | 'PROJECT'
    | 'SERVICE'
    | 'SYSTEM'
    | 'APP'
    | 'UNKNOWN';
  resource_id: number; // 资源ID，0表示所有资源
  action_type:
    | 'VIEW'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'EXECUTE'
    | 'MANAGE'
    | 'UNKNOWN';
  role_id: number;
}
