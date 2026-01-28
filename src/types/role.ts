export interface Role {
  roleId: number
  roleName: string
  roleDisplayName: string
  description: string
  status: number
  version: number
  secretToken: string
  disabled?: boolean // 分配角色时用
}
