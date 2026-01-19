import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: 0,
    username: '',
    nickname: '',
    roles: [] as any[],
    permissions: [] as string[],
  }),

  actions: {
    async fetchMe() {
      const data = await request.get('/me')
      this.userId = data.userId
      this.username = data.username
      this.nickname = data.nickname
      this.roles = data.roles
      this.permissions = data.permissions.map((p: any) => p.permissionName)
    },

    logout() {
      localStorage.clear()
      location.href = '/login'
    },
  },
})
