import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/login/Login.vue') },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: 'users',
          component: () => import('@/views/system/Users.vue'),
          meta: { permission: 'USER:VIEW' },
        },
        {
          path: 'roles',
          component: () => import('@/views/system/Roles.vue'),
          meta: { permission: 'ROLE:VIEW' },
        },
        {
          path: 'permissions',
          component: () => import('@/views/system/Permissions.vue'),
          meta: { permission: 'PERMISSION:VIEW' },
        },
        {
          path: 'auditlogs',
          component: () => import('@/views/system/AuditLogs.vue'),
          meta: { permission: 'AUDIT:VIEW' },
        },
        {
          path: 'profile',
          component: () => import('@/views/profile/Profile.vue'),
        },
      ],
    },
    {
      path: '/403',
      component: () => import('@/views/Forbidden.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const store = useUserStore()
  const token = localStorage.getItem('token')

  // 1. 未登录 → 去 login
  if (to.path !== '/login' && !token) {
    return '/login'
  }

  // 2. 已登录但 Pinia 没数据 → 拉 /me
  // 只要有 token，就认为是“已登录”
  // 但 Pinia 是内存状态，刷新会丢。
  // 所以：如果权限列表是空的 → 说明是刷新或首次进入 → 调 /me
  if (token && !store.permissions.length) {
    await store.fetchMe()
  }

  // 3. 权限校验（必须先拉权限，再进行权限校验）
  const requiredPermission = to.meta.permission as string | undefined
  if (requiredPermission) {
    if (!store.hasPermission(requiredPermission)) {
      return '/403'
    }
  }
})

export default router
