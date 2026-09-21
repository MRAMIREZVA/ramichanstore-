export interface AppUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roleId: number;
  roleName: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  roleId: number;
  active: boolean;
}

export interface UserUpdateRequest {
  username: string;
  email: string;
  fullName: string;
  roleId: number;
  active: boolean;
}

export interface Permission {
  id: number;
  code: string;
  module: string;
  description: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export interface RoleRequest {
  name: string;
  description: string | null;
  permissionIds: number[];
}
