// 审计日志查询条件
export interface AuditLogQuery {
  /** 当前页码（从 1 开始） */
  pageNum: number

  /** 每页条数 */
  pageSize: number

  /** 用户名（模糊查询） */
  username: string

  /** 权限名称（模糊查询） */
  permissionName: string

  /**
   * 是否成功
   * null：全部
   * 0：失败
   * 1：成功
   */
  success: number | null

  /**
   * 开始时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
   * null：不限制
   */
  startDate: string | null

  /**
   * 结束时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
   * null：不限制
   */
  endDate: string | null
}

// 审计日志分页查询结果
export interface AuditLog {
  logSeq: number

  username: string

  permissionName: string

  path: string

  method: string

  ip: string

  success: number

  errorMessage: string

  createTime: string
}
