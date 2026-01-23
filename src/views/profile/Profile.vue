<template>
    <!-- 基本信息 -->
    <el-descriptions title="基本信息" :column="2" border>
      <el-descriptions-item label="用户名">
        {{ me.username }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ me.createTime }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- 可编辑信息 -->
    <el-divider />

    <el-form :model="form" label-width="80px" style="max-width: 400px">
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="updateProfile">
          保存信息
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 角色 -->
    <el-divider />

    <el-descriptions title="角色">
      <el-descriptions-item>
        <el-tag
          v-for="r in me.roles"
          :key="r.roleId"
          style="margin-right: 6px"
        >
          {{ r.roleDisplayName }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 权限 -->
    <el-divider />

    <el-descriptions title="权限">
      <el-descriptions-item>
        <el-tag
          v-for="p in me.permissions"
          :key="p.permissionId"
          type="success"
          style="margin: 4px"
        >
          {{ p.permissionDisplayName }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 修改密码 -->
    <el-divider />

    <el-form
      :model="passwordForm"
      label-width="100px"
      style="max-width: 400px"
    >
      <el-form-item label="原密码">
        <el-input
          v-model="passwordForm.oldPassword"
          type="password"
        />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
        />
      </el-form-item>
      <el-form-item label="确认新密码">
        <el-input
          v-model="confirmPassword"
          type="password"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="warning" @click="changePassword">
          修改密码
        </el-button>
      </el-form-item>
    </el-form>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

/* 个人信息 */
const me = ref<any>({
  roles: [],
  permissions: [],
})

/* 可编辑信息 */
const form = reactive({
  nickname: '',
  email: '',
})

/* 修改密码 */
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
})
const confirmPassword = ref('')

/* 加载个人信息 */
const loadMe = async () => {
  const data = await request.get('/me')
  me.value = data
  form.nickname = data.nickname
  form.email = data.email
}

/* 更新个人信息 */
const updateProfile = async () => {
  await request.put('/me', {
    nickname: form.nickname || null,
    email: form.email || null,
  })
  ElMessage.success('个人信息已更新')
  loadMe()
}

/* 修改密码 */
const changePassword = async () => {
  if (passwordForm.newPassword !== confirmPassword.value) {
    ElMessage.error('两次密码不一致')
    return
  }

  await request.put('/me/password/change', passwordForm)
  ElMessage.success('密码修改成功，请重新登录')

  localStorage.clear()
  location.href = '/login'
}

onMounted(loadMe)
</script>
