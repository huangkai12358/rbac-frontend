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

const router = useRouter()
const form = reactive({
  username: '',
  password: '',
})

const login = async () => {
  const data = await request.post('/auth/login', form)
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data))
  router.push('/')
}
</script>
