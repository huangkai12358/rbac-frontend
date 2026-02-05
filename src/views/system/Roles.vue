<template>
  <!-- 查询区 -->
  <el-form :inline="true" @submit.prevent>
    <!--在 <el-form> 里按 Enter，浏览器会默认“提交表单并刷新页面”。submit：监听表单提交 .prevent：阻止默认行为（刷新页面）-->
    <el-form-item>
      <el-input v-model="query.roleName" placeholder="角色名" clearable @keyup.enter="load(1)" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="load(1)">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>

  <!-- 操作区 -->
  <div class="toolbar">
    <!-- 左侧按钮 -->
    <el-button type="primary" style="margin: 10px 0" v-permission="'ROLE:CREATE'" @click="openCreate">
      新建用户
    </el-button>

    <!-- 右侧按钮 -->
    <el-button type="primary" @click="exportExcel">
      导出数据
    </el-button>
  </div>

  <!-- 表格 -->
  <el-table :data="list" border style="margin-top: 12px" @sort-change="handleSortChange">
    <el-table-column prop="roleId" label="ID" width="80" sortable="custom" />
    <el-table-column prop="roleName" label="角色标识" width="150" sortable="custom" />
    <el-table-column prop="roleDisplayName" label="角色名称" width="150" />

    <el-table-column prop="description" label="描述">
      <template #default="{ row }">
        <div style="white-space: pre-line;"> <!-- 把 \n 当场换行符显示，合并多个空格 -->
          {{ row.description }}
        </div>
      </template>
    </el-table-column>

    <el-table-column prop="status" label="状态" width="80" sortable="custom">
      <template #default="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="createTime" label="创建时间" width="170" sortable="custom" />

    <el-table-column label="操作" width="340">
      <template #default="{ row }">

        <el-button size="small" type="info" @click="openRoleDetail(row)">
          查看详情
        </el-button>

        <el-button size="small" type="primary" v-permission="'ROLE:UPDATE'" @click="edit(row)">
          编辑
        </el-button>

        <el-button size="small" type="danger" v-permission="'ROLE:STATUS'" @click="toggle(row)">
          {{ row.status === 1 ? '禁用' : '启用' }}
        </el-button>

        <el-button size="small" type="success" v-permission="'ROLE:ASSIGN'" @click="openPermissionDialog(row)">
          分配权限
        </el-button>

      </template>
    </el-table-column>
  </el-table>

  <!-- 分页 -->
  <el-pagination style="margin-top: 12px" background :total="total" :page-size="query.pageSize"
    :current-page="query.pageNum" @current-change="load" />

  <!-- 新建 / 编辑弹窗 -->
  <el-dialog v-model="visible" title="角色">
    <el-form ref="formRef" :model="form" :rules="editingId ? {} : rules" label-width="80px">
      <el-form-item label="角色标识" prop="roleName" :required="!editingId">
        <el-input v-model="form.roleName" />
      </el-form-item>
      <el-form-item label="角色名称" prop="roleDisplayName" :required="!editingId">
        <el-input v-model="form.roleDisplayName" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>

  <!-- 分配权限弹窗 -->
  <el-dialog v-model="permissionVisible" title="分配权限" width="600px">
    <el-tree ref="permissionTreeRef" :data="permissionTree" show-checkbox node-key="permissionId" default-expand-all
      :props="{
        label: 'permissionDisplayName',
        children: 'children',
        disabled: 'disabled'
      }" />


    <template #footer>
      <el-button @click="permissionVisible = false">取消</el-button>
      <el-button type="primary" @click="submitPermissions">
        保存
      </el-button>
    </template>
  </el-dialog>

  <!-- 角色详情抽屉 -->
  <el-drawer v-model="detailVisible" title="角色详情" size="40%">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="角色标识">
        {{ detail.roleName }}
      </el-descriptions-item>
      <el-descriptions-item label="角色名称">
        {{ detail.roleDisplayName }}
      </el-descriptions-item>
      <el-descriptions-item label="描述">
        {{ detail.description || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="detail.status === 1 ? 'success' : 'danger'">
          {{ detail.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <!-- 权限 -->
    <h4>权限</h4>
    <el-tag v-for="p in rolePermissions" :key="p.permissionId" type="success" style="margin: 4px">
      {{ p.permissionDisplayName }}
    </el-tag>
  </el-drawer>

</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import request from '@/utils/request'
import type { Role } from '@/types/role'
import { ElMessage } from 'element-plus'
import type { PageResult } from '@/types/page'
import type { Permission } from '@/types/permission'
import type { Me } from '@/types/me'

/* 表格数据 */
const list = ref<any[]>([])
const total = ref(0)

/* 查询条件 */
const query = ref({
  pageNum: 1,
  pageSize: 10,
  roleName: '',
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

  // 重置当前页
  query.value.pageNum = 1

  load(1)
}

/* 新建 / 编辑 */
const visible = ref(false)
const editingId = ref<number | null>(null)

// 定义一个统一表单
const form = ref({
  roleName: '',
  roleDisplayName: '',
  description: '',
  version: 0,
  secretToken: '',
})

/* 加载角色 */
const load = async (page = 1) => {
  query.value.pageNum = page
  const data = await request.get('/roles/page', { params: query.value }) as PageResult<Role>
  list.value = data.records
  total.value = data.total
}

/* 重置查询 */
const reset = () => {
  query.value = {
    pageNum: 1,
    pageSize: 10,
    roleName: '',
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
    roleName: '',
    roleDisplayName: '',
    description: '',
    version: 0,
    secretToken: '',
  }
  visible.value = true
}

/* 编辑 */
const edit = async (row: any) => {
  editingId.value = row.roleId

  const data = await request.get(`/roles/${row.roleId}`) as Role
  // 编辑时赋值
  form.value = {
    roleName: data.roleName,
    roleDisplayName: data.roleDisplayName,
    description: data.description,
    version: data.version,
    secretToken: data.secretToken,
  }

  visible.value = true
}

// 规则：新建角色：角色标识和角色名称必填
import type { FormRules, FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()

const rules: FormRules = {
  roleName: [
    {
      required: true,
      message: '请输入角色标识',
      trigger: 'blur',
    },
  ],
  roleDisplayName: [
    {
      required: true,
      message: '请输入角色名称',
      trigger: 'blur',
    },
  ],
}

/* 提交 */
const submit = async () => {
  // 新建才校验
  if (!editingId.value) {
    await formRef.value?.validate()
  }

  if (editingId.value) {
    // 修改：全量提交
    await request.put(`/roles/${editingId.value}`, form.value)
    ElMessage.success('修改成功')
  } else {
    // 创建：只取需要的字段
    const { roleName, roleDisplayName, description } = form.value // 解构
    await request.post('/roles', {
      roleName,
      roleDisplayName,
      description,
    })
    ElMessage.success('创建成功')
  }

  visible.value = false
  load()
}

/* 启用 / 禁用 */
const toggle = async (row: any) => {
  await request.put(`/roles/${row.roleId}/status`, {
    status: row.status === 1 ? 0 : 1,
  })
  load()
}

/* 分配权限 */
const permissionVisible = ref(false)
const currentRoleId = ref<number | null>(null)
const permissionTree = ref<Permission[]>([])
const permissionTreeRef = ref()
const myPermissionIds = ref<number[]>([])

/* 打开权限分配弹窗 */
const openPermissionDialog = async (row: any) => {
  currentRoleId.value = row.roleId
  permissionVisible.value = true

  // 1. 角色已有权限
  const rolePermissions = await request.get(
    `/roles/${row.roleId}/permissions`
  ) as Permission[]
  const rolePermissionIds = rolePermissions.map(p => p.permissionId)

  // 2. 当前登录人信息
  const me = await request.get('/me') as Me
  myPermissionIds.value = me.permissions.map(p => p.permissionId)


  // 3. 不管是不是超级管理员，统一查全量权限
  const allPermissions = await request.get('/permissions/page', {
    params: { pageNum: 1, pageSize: 1000, sortField: "createTime", sortOrder: "asc" } // 其实此处已经不需要按创建时间升序排序，后面 buildPermissionTreeWithDisabled 会递归排序权限
  }) as PageResult<Permission>

  // 4. 构建权限树 + 计算 disabled
  permissionTree.value = buildPermissionTreeWithDisabled(
    allPermissions.records,
    myPermissionIds.value
  )

  // 5. 默认勾选角色已有权限
  nextTick(() => {
    permissionTreeRef.value.setCheckedKeys(rolePermissionIds)
  })
}

/* 提交权限分配 */
const submitPermissions = async () => {
  if (!currentRoleId.value) return

  // 1. 树中被勾选的所有权限
  const checkedIds: number[] =
    permissionTreeRef.value.getCheckedKeys()

  // 2. 只保留“我拥有的权限”
  const allowedIds = checkedIds.filter(id =>
    myPermissionIds.value.includes(id)
  )

  await request.post(
    `/roles/${currentRoleId.value}/permissions`,
    { ids: allowedIds }
  )

  permissionVisible.value = false
  ElMessage.success('权限分配成功')
}

/* 角色详情 */
const detailVisible = ref(false)
const detail = ref<any>({})
const rolePermissions = ref<any[]>([])

/* 打开角色详情 Drawer */
const openRoleDetail = async (row: any) => {
  detailVisible.value = true
  detail.value = row

  // 查询角色拥有的权限
  rolePermissions.value = await request.get(
    `/roles/${row.roleId}/permissions`
  )
}

function buildPermissionTreeWithDisabled(
  list: Permission[],
  myPermissionIds: number[]
): Permission[] {

  const map = new Map<number, Permission>()
  const roots: Permission[] = [] // Permission 有 children 和 disabled 属性

  // 1. 初始化节点 + disabled 计算
  list.forEach(p => {
    map.set(p.permissionId, {
      ...p,
      children: [],
      // 我没有的权限，直接禁用
      disabled: !myPermissionIds.includes(p.permissionId),
    })
  })

  // 2. 组装父子关系
  list.forEach(p => {
    const node = map.get(p.permissionId)!
    if (p.parentId === 0) {
      roots.push(node)
    } else {
      const parent = map.get(p.parentId)
      parent && parent.children!.push(node)
    }
  })

  // 3. 递归排序（按 sort 升序）
  const sortTree = (nodes: Permission[]) => {
    nodes.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)) // sort 为空的兜底，避免 null / undefined 崩掉。
    nodes.forEach(n => {
      if (n.children && n.children.length > 0) {
        sortTree(n.children)
      }
    })
  }
  sortTree(roots)

  return roots
}

/* 导出 Excel */
const exportExcel = async () => {
  const res = await request.get('/roles/export', {
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
  a.download = '角色数据.xlsx'
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
