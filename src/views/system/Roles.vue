<template>
  <el-button type="primary" v-permission="'ROLE:CREATE'" @click="openCreate">
    新建角色
  </el-button>

  <el-table :data="list" style="margin-top: 12px">
    <el-table-column prop="roleName" label="角色标识" />
    <el-table-column prop="roleDisplayName" label="角色名称" />
    <el-table-column prop="description" label="描述" />
    <el-table-column prop="status" label="状态">
      <template #default="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="420">
      <template #default="{ row }">

        <el-button size="small" type="info" @click="openRoleDetail(row)">
          查看详情
        </el-button>

        <el-button size="small" v-permission="'ROLE:UPDATE'" @click="edit(row)">
          编辑
        </el-button>

        <el-button size="small" v-permission="'ROLE:STATUS'" @click="toggle(row)">
          {{ row.status === 1 ? '禁用' : '启用' }}
        </el-button>

        <el-button size="small" v-permission="'ROLE:ASSIGN'" @click="openPermissionDialog(row)">
          分配权限
        </el-button>

      </template>
    </el-table-column>
  </el-table>

  <el-pagination style="margin-top: 12px" :total="total" :page-size="query.pageSize" @current-change="load" />

  <!-- 新建 / 编辑弹窗 -->
  <el-dialog v-model="visible" title="角色">
    <el-form :model="form">
      <el-form-item label="角色标识">
        <el-input v-model="form.roleName" />
      </el-form-item>
      <el-form-item label="角色名称">
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

    <h4>拥有的权限</h4>
    <el-tag v-for="p in rolePermissions" :key="p.permissionId" type="success" style="margin: 4px">
      {{ p.permissionName }}
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

const list = ref<any[]>([])
const total = ref(0)
const visible = ref(false)
const editingId = ref<number | null>(null)

const query = ref({
  pageNum: 1,
  pageSize: 10,
})

// 定义一个统一表单
const form = ref({
  roleName: '',
  roleDisplayName: '',
  description: '',
  version: 0,
  secretToken: '',
})

const load = async (page = 1) => {
  query.value.pageNum = page
  const data = await request.get('/roles/page', { params: query.value }) as PageResult<Role>
  list.value = data.records
  total.value = data.total
}

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

const submit = async () => {
  if (editingId.value) {
    // 修改：全量提交
    await request.put(`/roles/${editingId.value}`, form.value)
    ElMessage.success('修改成功')
  } else {
    // 创建：只取需要的字段
    const { roleName, roleDisplayName, description } = form.value // 解构
    await request.post('/roles', { roleName, roleDisplayName, description })
    ElMessage.success('创建成功')
  }
  visible.value = false
  load()
}

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

/* 打开分配权限弹窗 */
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
    params: { pageNum: 1, pageSize: 1000 }
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
  const roots: Permission[] = []

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

  return roots
}


load()
</script>
