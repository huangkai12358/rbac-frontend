<template>
  <!-- 基本信息 -->
  <el-descriptions title="个人信息" :column="2" label-width="100" border>
    <el-descriptions-item label="用户名">
      {{ me.username }}
    </el-descriptions-item>
    <el-descriptions-item label="昵称">
      {{ me.nickname || '-' }}
    </el-descriptions-item>
    <el-descriptions-item label="邮箱">
      {{ me.email || '-' }}
    </el-descriptions-item>
    <el-descriptions-item label="注册时间">
      {{ me.createTime }}
    </el-descriptions-item>
  </el-descriptions>

  <!-- 操作按钮 -->
  <div style="margin: 16px 0">
    <el-button type="primary" @click="openProfileDialog">
      修改信息
    </el-button>
    <el-button type="warning" @click="openPasswordDialog">
      修改密码
    </el-button>
  </div>

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

  <!-- 修改信息弹窗 -->
  <el-dialog v-model="profileVisible" title="修改个人信息" width="400px">
    <el-form :model="profileForm" label-width="80px">
      <el-form-item label="昵称">
        <el-input v-model="profileForm.nickname" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="profileForm.email" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="profileVisible = false">取消</el-button>
      <el-button type="primary" @click="updateProfile">
        保存
      </el-button>
    </template>
  </el-dialog>

  <!-- 修改密码弹窗 -->
  <el-dialog v-model="passwordVisible" title="修改密码" width="400px">
    <el-form :model="passwordForm" label-width="100px">
      <el-form-item label="原密码">
        <el-input
          v-model="passwordForm.oldPassword"
          type="password"
          show-password
        />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          show-password
        />
      </el-form-item>
      <el-form-item label="确认新密码">
        <el-input
          v-model="confirmPassword"
          type="password"
          show-password
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="passwordVisible = false">取消</el-button>
      <el-button type="warning" @click="changePassword">
        修改
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

/* 个人信息 */
const me = ref<any>({
  roles: [],
  permissions: [],
})

/* 弹窗状态 */
const profileVisible = ref(false)
const passwordVisible = ref(false)

/* 修改信息表单 */
const profileForm = reactive({
  nickname: '',
  email: '',
})

/* 修改密码表单 */
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
})
const confirmPassword = ref('')

/* 加载个人信息 */
const loadMe = async () => {
  const data = await request.get('/me')
  me.value = data
}

/* 打开修改信息弹窗 */
const openProfileDialog = () => {
  profileForm.nickname = me.value.nickname
  profileForm.email = me.value.email
  profileVisible.value = true
}

/* 更新个人信息 */
const updateProfile = async () => {
  await request.put('/me', {
    nickname: profileForm.nickname || null,
    email: profileForm.email || null,
  })

  ElMessage.success('个人信息已更新')
  profileVisible.value = false
  loadMe()
}

/* 打开修改密码弹窗 */
const openPasswordDialog = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  confirmPassword.value = ''
  passwordVisible.value = true
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
