import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/store/user";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: () => import("@/views/login/Login.vue") },
    {
      path: "/",
      component: () => import("@/layouts/AdminLayout.vue"),
      children: [
        { path: "users", component: () => import("@/views/system/Users.vue") },
        { path: "roles", component: () => import("@/views/system/Roles.vue") },
        { path: "permissions", component: () => import("@/views/system/Permissions.vue") },
        { path: "auditlogs", component: () => import("@/views/system/AuditLogs.vue") },
        {
          path: "profile",
          component: () => import("@/views/profile/Profile.vue"),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const token = localStorage.getItem("token");
  if (to.path !== "/login" && !token) {
    return "/login";
  }

  // 只要有 token，就认为是“已登录”
  // 但 Pinia 是内存状态，刷新会丢。
  // 所以：如果权限列表是空的 → 说明是刷新或首次进入 → 调 /me
  if (token) {
    const store = useUserStore();
    if (!store.permissions.length) {
      await store.fetchMe();
    }
  }
});

export default router;
