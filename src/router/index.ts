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
      ],
    },
    {
      path: "/profile",
      component: () => import("@/views/profile/Profile.vue"),
    },
  ],
});

router.beforeEach(async (to) => {
  const token = localStorage.getItem("token");
  if (to.path !== "/login" && !token) {
    return "/login";
  }

  if (token) {
    const store = useUserStore();
    if (!store.permissions.length) {
      await store.fetchMe();
    }
  }
});

export default router;
