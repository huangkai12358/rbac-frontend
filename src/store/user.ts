import { defineStore } from 'pinia'
import request from '@/utils/request'
import type { Me } from '@/types/me'
import type { Role } from '@/types/role'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: 0,
    username: '',
    nickname: '',
    roles: [] as Role[],
    permissions: [] as String[],
  }),

  actions: {
    async fetchMe() {
      const data = await request.get('/me') as Me
      this.userId = data.userId
      this.username = data.username
      this.nickname = data.nickname
      this.roles = data.roles
      this.permissions = data.permissions.map((p: any) => p.permissionName)
    },

    logout() {
      localStorage.clear()
      location.href = '/login' // 不同于 router.push('/login') 前端单页跳转，是 浏览器级整页跳转（刷新），会清空 JS 内存 和 Pinia 状态
    },
  },
})
