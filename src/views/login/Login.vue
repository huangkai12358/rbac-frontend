<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <div class="title">
        <h2>RBAC 管理系统</h2>
        <p>欢迎登录</p>
      </div>

      <el-form :model="form" class="login-form" @keyup.enter="login">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" clearable>
            <template #prefix>
              <el-icon>
                <User />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password>
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="login">
            登录
          </el-button>
        </el-form-item>
      </el-form>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import type { LoginResult } from '@/types/auth'
import { User, Lock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const redirect = route.query.redirect as string | undefined

const form = reactive({
  username: '',
  password: '',
})

/* 避免用户狂按回车或按钮 */
const loading = ref(false)

// 登录中 → 按钮转圈 + 禁用
// 登录结束 → 按钮恢复
const login = async () => {
  if (loading.value) return
  loading.value = true

  try {
    const data = await request.post('/auth/login', form) as LoginResult
    localStorage.setItem('token', data.token)

    // 其实已经不必要了，已经有 /me 和 Pinia 全局状态管理了。现在的架构：token → fetchMe() → Pinia → 页面
    // localStorage.setItem('user', JSON.stringify(data))

    // 优先回跳原页面，否则回首页
    router.replace(redirect || '/') // 用 replace 而不是 push，不把 /login 留在历史记录里，用户点“返回”不会回到登录页
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white
}

.login-card {
  width: 380px;
  padding: 24px 20px;
  border-radius: 12px;
}

.title {
  text-align: center;
  margin-bottom: 24px;
}

.title h2 {
  margin: 0;
  font-weight: 600;
}

.title p {
  margin: 6px 0 0;
  font-size: 14px;
  color: #888;
}

.login-form {
  margin-top: 10px;
}

.login-btn {
  width: 100%;
}
</style>
