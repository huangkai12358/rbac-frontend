<template>
  <el-form :model="form" class="login-form">
    <el-form-item>
      <el-input v-model="form.username" placeholder="用户名" />
    </el-form-item>
    <el-form-item>
      <el-input v-model="form.password" type="password" placeholder="密码" />
    </el-form-item>
    <el-button type="primary" @click="login">登录</el-button>
  </el-form>
</template>

<script setup lang="ts">
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import { reactive } from 'vue'
import type { LoginResult } from '@/types/auth'

const router = useRouter()
const form = reactive({
  username: '',
  password: '',
})

const login = async () => {
  const data = await request.post('/auth/login', form) as LoginResult
  localStorage.setItem('token', data.token)

  // 其实已经不必要了，已经有 /me 和 Pinia 全局状态管理了。现在的架构：token → fetchMe() → Pinia → 页面
  // localStorage.setItem('user', JSON.stringify(data))

  router.push('/')
}
</script>
