<template>
  <el-container style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside width="200px">
      <el-menu router>
        <el-menu-item index="/profile">个人中心</el-menu-item>
        <el-menu-item v-permission="'USER:VIEW'" index="/users">用户管理</el-menu-item>
        <el-menu-item v-permission="'ROLE:VIEW'" index="/roles">角色管理</el-menu-item>
        <el-menu-item v-permission="'PERMISSION:VIEW'" index="/permissions">权限管理</el-menu-item>
        <el-menu-item v-permission="'AUDIT:VIEW'" index="/auditlogs">审计管理</el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主区域 -->
    <el-container>
      <el-header style="display:flex;justify-content:space-between">
        <div>RBAC 管理后台</div>
        <el-button type="text" @click="logout">退出</el-button>
      </el-header>

      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'

const store = useUserStore()

const logout = () => {
  store.logout()
}
</script>
