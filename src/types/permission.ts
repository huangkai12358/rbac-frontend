export interface Permission {
  permissionId: number
  permissionName: string
  permissionDisplayName: string
  description: string
  status: number
  version: number
  secretToken: string
  type: number
  parentId: number
  path: string
  method: string
  sort: number // 默认为 0
  children?: Permission[] // 分配权限时用
  disabled?: boolean // 分配权限时用
}
