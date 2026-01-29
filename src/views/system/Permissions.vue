<template>
  <el-button type="primary" v-permission="'PERMISSION:CREATE'" @click="openCreate">
    新建权限
  </el-button>

  <el-table :data="list" style="margin-top: 12px">
    <el-table-column prop="permissionId" label="ID" width="80" />
    <el-table-column prop="permissionName" label="权限标识" />
    <el-table-column prop="permissionDisplayName" label="权限名称" />
    <el-table-column prop="type" label="类型" />
    <el-table-column prop="path" label="路径" />
    <el-table-column prop="method" label="方法" />

    <el-table-column label="状态">
      <template #default="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column label="操作">
      <template #default="{ row }">
        <el-button size="small" v-permission="'PERMISSION:UPDATE'" @click="edit(row)">
          编辑
        </el-button>
        <el-button size="small" v-permission="'PERMISSION:STATUS'" @click="toggle(row)">
          {{ row.status === 1 ? '禁用' : '启用' }}
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-pagination style="margin-top: 12px" :total="total" :page-size="query.pageSize" @current-change="load" />

  <el-dialog v-model="visible" title="权限">
    <el-form :model="form">
      <el-form-item label="权限标识">
        <el-input v-model="form.permissionName" />
      </el-form-item>
      <el-form-item label="权限名称">
        <el-input v-model="form.permissionDisplayName" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" />
      </el-form-item>
      <el-form-item label="类型">
        <el-input-number v-model="form.type" />
      </el-form-item>
      <el-form-item label="父权限ID">
        <el-input-number v-model="form.parentId" />
      </el-form-item>
      <el-form-item label="路径">
        <el-input v-model="form.path" />
      </el-form-item>
      <el-form-item label="方法">
        <el-input v-model="form.method" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.sort" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import request from '@/utils/request'
import type { PageResult } from '@/types/page'
import type { Permission } from '@/types/permission'
import { ElMessage } from 'element-plus'

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
  permissionName: '',
  permissionDisplayName: '',
  description: '',
  type: 2,
  parentId: 0,
  path: '',
  method: '',
  sort: 0,
  version: 0,
  secretToken: '',
})

const load = async (page = 1) => {
  query.value.pageNum = page
  const data = await request.get('/permissions/page', { params: query.value }) as PageResult<Permission>
  list.value = data.records
  total.value = data.total
}

const openCreate = () => {
  editingId.value = null

  // 新建时重置
  form.value = {
    permissionName: '',
    permissionDisplayName: '',
    description: '',
    type: 2,
    parentId: 0,
    path: '',
    method: '',
    sort: 0,
    version: 0,
    secretToken: '',
  }

  visible.value = true
}

const edit = async (row: any) => {
  editingId.value = row.permissionId

  const data = await request.get(`/permissions/${row.permissionId}`) as Permission
  // 编辑时赋值
  form.value = {
    permissionName: data.permissionName,
    permissionDisplayName: data.permissionDisplayName,
    description: data.description,
    type: data.type,
    parentId: data.parentId,
    path: data.path,
    method: data.method,
    sort: data.sort,
    version: data.version,
    secretToken: data.secretToken
  }

  visible.value = true
}

const submit = async () => {
  if (editingId.value) {
    // 修改：全量提交
    await request.put(`/permissions/${editingId.value}`, form.value)
    ElMessage.success('修改成功')
  } else {
    // 创建：只取需要的字段
    const {
      permissionName,
      permissionDisplayName,
      description,
      type,
      parentId,
      path,
      method,
      sort,
    } = form.value // 解构

    await request.post('/permissions', {
      permissionName,
      permissionDisplayName,
      description,
      type,
      parentId,
      path,
      method,
      sort,
    })
    ElMessage.success('创建成功')
  }
  visible.value = false
  load()
}

const toggle = async (row: any) => {
  await request.put(`/permissions/${row.permissionId}/status`, {
    status: row.status === 1 ? 0 : 1,
  })
  load()
}

load()
</script>
