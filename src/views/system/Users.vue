<template>
  <!-- 查询区 -->
  <el-form inline>
    <el-form-item>
      <el-input v-model="query.username" placeholder="用户名" clearable @keyup.enter="load(1)" />
    </el-form-item>
    <el-button type="primary" @click="load(1)">查询</el-button>
  </el-form>

  <!-- 操作区 -->
  <el-button type="primary" style="margin: 10px 0" v-permission="'USER:CREATE'" @click="openCreate">
    新建用户
  </el-button>

  <!-- 表格 -->
  <el-table :data="list" border>
    <el-table-column prop="userId" label="ID" width="80" />
    <el-table-column prop="username" label="用户名" />
    <el-table-column prop="nickname" label="昵称" />
    <el-table-column prop="email" label="邮箱" />

    <el-table-column label="状态">
      <template #default="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="420">
      <template #default="{ row }">

        <el-button size="small" type="info" @click="openDetail(row)">
          查看详情
        </el-button>

        <el-button size="small" v-permission="'USER:UPDATE'" @click="edit(row)">
          编辑
        </el-button>

        <el-button size="small" type="warning" v-permission="'USER:PASSWORD:RESET'" @click="resetPassword(row)">
          重置密码
        </el-button>

        <el-button size="small" type="danger" v-permission="'USER:STATUS'" @click="toggleStatus(row)">
          {{ row.status === 1 ? '禁用' : '启用' }}
        </el-button>

        <el-button size="small" v-permission="'USER:ASSIGN'" @click="openRoleDialog(row)">
          分配角色
        </el-button>

      </template>
    </el-table-column>
  </el-table>

  <!-- 分页 -->
  <el-pagination style="margin-top: 12px" background layout="prev, pager, next" :total="total"
    :page-size="query.pageSize" @current-change="load" />

  <!-- 新建 / 编辑弹窗 -->
  <el-dialog v-model="visible" title="用户">
    <el-form :model="form" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" :disabled="!!editingId" />
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
      <el-checkbox v-for="r in roleList" :key="r.roleId" :label="r.roleId">
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

/* 表格数据 */
const list = ref<any[]>([])
const total = ref(0)

/* 查询条件 */
const query = ref({
  pageNum: 1,
  pageSize: 10,
  username: '',
})

/* 新建 / 编辑 */
const visible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({
  username: '',
  nickname: '',
  email: '',
})

/* 角色分配 */
const roleVisible = ref(false)
const currentUserId = ref<number>(0)
const roleList = ref<any[]>([])
const checkedRoleIds = ref<number[]>([])

/* 加载用户 */
const load = async (page = 1) => {
  query.value.pageNum = page
  const data = await request.get('/users/page', { params: query.value })
  list.value = data.records
  total.value = data.total
}

/* 新建 */
const openCreate = () => {
  editingId.value = null
  form.value = { username: '', nickname: '', email: '' }
  visible.value = true
}

/* 编辑 */
const edit = (row: any) => {
  editingId.value = row.userId
  form.value = {
    username: row.username,
    nickname: row.nickname,
    email: row.email,
  }
  visible.value = true
}

/* 提交 */
const submit = async () => {
  if (editingId.value) {
    await request.put(`/users/${editingId.value}`, form.value)
  } else {
    await request.post('/users', form.value)
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

/* 打开角色分配 */
const openRoleDialog = async (row: any) => {
  currentUserId.value = row.userId
  roleVisible.value = true

  // 查询用户已有角色
  const userRoles = await request.get(`/users/${row.userId}/roles`)
  checkedRoleIds.value = userRoles.map((r: any) => r.roleId)

  // 查询所有角色（分页接口复用）
  const allRoles = await request.get('/roles/page', {
    params: { pageNum: 1, pageSize: 100 },
  })
  roleList.value = allRoles.records
}

/* 提交角色 */
const submitRoles = async () => {
  await request.post(`/users/${currentUserId.value}/roles`, {
    ids: checkedRoleIds.value,
  })
  roleVisible.value = false
  ElMessage.success('角色分配成功')
}

/* 用户详情 */
const detailVisible = ref(false)
const detail = ref<any>({})
const roles = ref<any[]>([])
const permissions = ref<any[]>([])

/* 打开详情抽屉 */
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

load()
</script>
