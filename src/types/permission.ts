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
}
