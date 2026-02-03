<template>
  <!-- 查询区 -->
  <el-form :inline="true" @submit.prevent>
    <!--在 <el-form> 里按 Enter，浏览器会默认“提交表单并刷新页面”。submit：监听表单提交 .prevent：阻止默认行为（刷新页面）-->
    <el-form-item>
      <el-input v-model="query.username" placeholder="用户名" clearable @keyup.enter="load(1)" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="load(1)">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>

  <!-- 操作区 -->
  <div class="toolbar">
    <!-- 左侧按钮 -->
    <el-button type="primary" style="margin: 10px 0" v-permission="'USER:CREATE'" @click="openCreate">
      新建用户
    </el-button>

    <!-- 右侧按钮 -->
    <el-button type="primary" @click="exportExcel">
      导出数据
    </el-button>
  </div>

  <!-- 表格 -->
  <el-table :data="list" border style="margin-top: 12px" @sort-change="handleSortChange">
    <el-table-column prop="userId" label="ID" width="80" sortable="custom" />
    <el-table-column prop="username" label="用户名" sortable="custom" />
    <el-table-column prop="nickname" label="昵称" />
    <el-table-column prop="email" label="邮箱" sortable="custom" />

    <el-table-column prop="status" label="状态" width="80" sortable="custom">
      <template #default="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="createTime" label="创建时间" width="170" sortable="custom" />
    <el-table-column prop="updateTime" label="修改时间" width="170" sortable="custom" />

    <el-table-column label="操作" width="420">
      <template #default="{ row }">

        <el-button size="small" type="info" @click="openDetail(row)">
          查看详情
        </el-button>

        <el-button size="small" type="primary" v-permission="'USER:UPDATE'" @click="edit(row)">
          编辑
        </el-button>

        <el-button size="small" type="warning" v-permission="'USER:PASSWORD:RESET'" @click="resetPassword(row)">
          重置密码
        </el-button>

        <el-button size="small" type="danger" v-permission="'USER:STATUS'" @click="toggleStatus(row)">
          {{ row.status === 1 ? '禁用' : '启用' }}
        </el-button>

        <el-button size="small" type="success" v-permission="'USER:ASSIGN'" @click="openRoleDialog(row)">
          分配角色
        </el-button>

      </template>
    </el-table-column>
  </el-table>

  <!-- 分页 -->
  <el-pagination style="margin-top: 12px" background :total="total" :page-size="query.pageSize"
    @current-change="load" />
  <!--Element Plus 自动把当前页码作为参数传给 load-->

  <!-- 新建 / 编辑弹窗 -->
  <el-dialog v-model="visible" title="用户">
    <el-form :model="form" :rules="editingId ? {} : rules" label-width="80px" ref="formRef">
      <el-form-item label="用户名" prop="username" :required="!editingId">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>

  <!-- 分配角色弹窗 -->
  <el-dialog v-model="roleVisible" title="分配角色">
    <el-checkbox-group v-model="checkedRoleIds">
      <el-checkbox v-for="r in roleList" :key="r.roleId" :label="r.roleId" :disabled="r.disabled">
        <!--label：checkbox 的值（当作 value 来使用，将在 3.0.0 被废弃）-->
        {{ r.roleDisplayName }}
      </el-checkbox>
    </el-checkbox-group>

    <template #footer>
      <el-button @click="roleVisible = false">取消</el-button>
      <el-button type="primary" @click="submitRoles">保存</el-button>
    </template>
  </el-dialog>

  <!-- 用户详情抽屉 -->
  <el-drawer v-model="detailVisible" title="用户详情" size="40%">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="用户名">
        {{ detail.username }}
      </el-descriptions-item>
      <el-descriptions-item label="昵称">
        {{ detail.nickname || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="邮箱">
        {{ detail.email || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="detail.status === 1 ? 'success' : 'danger'">
          {{ detail.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <!-- 角色 -->
    <h4>角色</h4>
    <el-tag v-for="r in roles" :key="r.roleId" style="margin-right: 6px">
      {{ r.roleDisplayName }}
    </el-tag>

    <el-divider />

    <!-- 权限 -->
    <h4>权限</h4>
    <el-tag v-for="p in permissions" :key="p.permissionId" type="success" style="margin: 4px">
      {{ p.permissionName }}
    </el-tag>
  </el-drawer>

</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import request from '@/utils/request'
import type { PageResult } from '@/types/page'
import type { User } from '@/types/user'
import type { Role } from '@/types/role'
import type { Me } from '@/types/me'

/* 表格数据 */
const list = ref<any[]>([])
const total = ref(0)

/* 查询条件 */
const query = ref({
  pageNum: 1,
  pageSize: 10,
  username: '',
  sortField: '',
  sortOrder: '',
})

// 处理表头排序事件
const handleSortChange = ({ prop, order }: any) => {
  query.value.sortField = prop || ''
  query.value.sortOrder =
    order === 'ascending'
      ? 'asc'
      : order === 'descending'
        ? 'desc'
        : ''

  load(1)
}

/* 新建 / 编辑 */
const visible = ref(false)
const editingId = ref<number | null>(null)

// 定义一个统一表单
const form = ref({
  username: '',
  nickname: '',
  email: '',
  version: 0,
  secretToken: '',
})

/* 加载用户 */
const load = async (page = 1) => {
  query.value.pageNum = page
  const data = await request.get('/users/page', { params: query.value }) as PageResult<User>
  list.value = data.records
  total.value = data.total
}

/* 重置查询 */
const reset = () => {
  query.value = {
    pageNum: 1,
    pageSize: 10,
    username: '',
    sortField: '',
    sortOrder: '',
  }
  load(1)
}

/* 新建 */
const openCreate = () => {
  editingId.value = null

  // 新建时重置
  form.value = {
    username: '',
    nickname: '',
    email: '',
    version: 0,
    secretToken: '',
  }

  visible.value = true
}

/* 编辑 */
const edit = async (row: any) => {
  editingId.value = row.userId

  const data = await request.get(`/users/${row.userId}`) as User
  // 编辑时赋值
  form.value = {
    username: data.username,
    nickname: data.nickname,
    email: data.email,
    version: data.version,
    secretToken: data.secretToken,
  }

  visible.value = true
}

// 规则：新建用户：用户名必填
import type { FormRules } from 'element-plus'

const rules: FormRules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: 'blur',
    },
  ],
}

/* 提交 */
import type { FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()

const submit = async () => {
  // 只有新建才校验
  if (!editingId.value) {
    await formRef.value?.validate()
  }

  if (editingId.value) { // editingId 存在表示 修改用户
    await request.put(`/users/${editingId.value}`, form.value)
    ElMessage.success('修改成功')
  } else { // editingId 不存在表示 创建用户
    // 创建：只取需要的字段
    const { username, nickname, email } = form.value // 解构
    await request.post('/users', { username, nickname, email })
    ElMessage.success('创建成功')
  }

  visible.value = false
  load()
}

/* 启用 / 禁用 */
const toggleStatus = async (row: any) => {
  await request.put(`/users/${row.userId}/status`, {
    status: row.status === 1 ? 0 : 1,
  })
  load()
}

/* 重置密码 */
const resetPassword = async (row: any) => {
  await ElMessageBox.confirm(
    `确定要重置用户【${row.username}】的密码吗？`,
    '提示',
    { type: 'warning' }
  )
  await request.post(`/users/${row.userId}/password/reset`)
  ElMessage.success('密码已重置')
}

/* 分配角色 */
const roleVisible = ref(false)
const currentUserId = ref<number>(0)
const roleList = ref<any[]>([])
const checkedRoleIds = ref<number[]>([])
const myRoleIds = ref<number[]>([])


/* 打开角色分配弹窗 */
const openRoleDialog = async (row: any) => {
  currentUserId.value = row.userId
  roleVisible.value = true

  // 1. 被分配用户已有角色
  const userRoles = await request.get(
    `/users/${row.userId}/roles`
  ) as Role[]
  const userRoleIds = userRoles.map(r => r.roleId)

  // 2. 查询当前登录人信息
  const me = await request.get('/me') as Me
  const isSuperAdmin = me.roles.some(
    r => r.roleName === 'SUPER_ADMIN'
  )

  myRoleIds.value = me.roles.map(r => r.roleId)

  // 3. 统一查询全部角色
  const allRoles = await request.get('/roles/page', {
    params: { pageNum: 1, pageSize: 1000 }
  }) as PageResult<Role>

  // 4. 计算 disabled（核心）
  roleList.value = allRoles.records.map(r => {
    // 超级管理员：全部可操作
    if (isSuperAdmin) {
      return { ...r, disabled: false }
    }

    // 普通管理员：我没有的角色禁用
    return {
      ...r,
      disabled: !myRoleIds.value.includes(r.roleId)
    }
  })

  // 5. 默认勾选：用户已有的角色
  checkedRoleIds.value = userRoleIds
}

/* 提交角色分配 */
const submitRoles = async () => {
  // 只允许提交“我拥有的角色”
  const allowedRoleIds = checkedRoleIds.value.filter(id =>
    myRoleIds.value.includes(id)
  )

  await request.post(
    `/users/${currentUserId.value}/roles`,
    { ids: allowedRoleIds }
  )

  roleVisible.value = false
  ElMessage.success('角色分配成功')
}

/* 用户详情 */
const detailVisible = ref(false)
const detail = ref<any>({})
const roles = ref<any[]>([])
const permissions = ref<any[]>([])

/* 打开用户详情抽屉 */
const openDetail = async (row: any) => {
  detailVisible.value = true
  detail.value = row

  // 查询角色
  roles.value = await request.get(`/users/${row.userId}/roles`)

  // 查询权限
  permissions.value = await request.get(
    `/users/${row.userId}/permissions`
  )
}

/* 导出 Excel */
const exportExcel = async () => {
  const res = await request.get('/users/export', {
    params: query.value,
    responseType: 'blob',
  })

  // res.data 才是真正的二进制内容
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '用户数据.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}

/* 初始加载 */
load()
</script>

<style>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>
