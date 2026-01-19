<template>
  <!-- 应用根节点，仅负责承载路由 -->
  <router-view />
</template>

<script setup lang="ts">
/**
 * App.vue 只作为应用入口，不写业务逻辑
 * 权限校验 / 登录态校验统一放在 router 守卫中
 */
</script>

<style>
/* 全局基础样式（可选） */
html,
body,
#app {
  height: 100%;
  margin: 0;
}

/* 去除默认滚动条抖动（可选） */
body {
  overflow: hidden;
}
</style>
