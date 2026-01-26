import type { Role } from "./role"
import type { Permission } from "./permission"

export interface Me {
  userId: number
  username: string
  nickname: string
  roles: Role[]
  permissions: Permission[]
}
