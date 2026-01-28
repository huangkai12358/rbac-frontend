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
    {
      path: '/:pathMatch(.*)*', // 404 页面，放最后
      component: () => import('@/views/NotFound.vue'),
      meta: { notFound: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const store = useUserStore()
  const token = localStorage.getItem('token')

  // 1. 白名单（最先判断）
  const whiteList = ['/login']
  if (whiteList.includes(to.path)) {
    return true
  }

  // 2. 是否 404 路由
  const isNotFound = to.meta.notFound === true

  // 3. 未登录
  if (!token) {
    // 只有“非 404 页面”才跳 login
    if (!isNotFound) {
      return '/login'
    }
    // 404 直接放行
    return true
  }

  // 4. 已登录但 Pinia 没数据 → 拉 /me
  // 只要有 token，就认为是“已登录”
  // 但 Pinia 是内存状态，刷新会丢。
  // 所以：如果权限列表是空的 → 说明是刷新或首次进入 → 调 /me
  if (token && !store.permissions.length) {
    try {
      await store.fetchMe()
    } catch {
      // token 失效
      return '/login'
    }
  }

  // 5. 权限校验（必须先拉权限，再进行权限校验）
  const requiredPermission = to.meta.permission as string | undefined
  if (requiredPermission) {
    if (!store.hasPermission(requiredPermission)) {
      return '/403'
    }
  }

  // 6. 放行（不写默认返回 undefined，也会放行）
  return true
})

export default router
