<template>
  <el-button
    type="primary"
    v-permission="'PERMISSION:CREATE'"
    @click="openCreate"
  >
    新建权限
  </el-button>

  <el-table :data="list" style="margin-top: 12px">
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
        <el-button
          size="small"
          v-permission="'PERMISSION:EDIT'"
          @click="edit(row)"
        >
          编辑
        </el-button>
        <el-button
          size="small"
          v-permission="'PERMISSION:STATUS'"
          @click="toggle(row)"
        >
          {{ row.status === 1 ? '禁用' : '启用' }}
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-pagination
    style="margin-top: 12px"
    :total="total"
    :page-size="query.pageSize"
    @current-change="load"
  />

  <el-dialog v-model="visible" title="权限">
    <el-form :model="form">
      <el-form-item label="权限标识">
        <el-input v-model="form.permissionName" />
      </el-form-item>
      <el-form-item label="权限名称">
        <el-input v-model="form.permissionDisplayName" />
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

const list = ref<any[]>([])
const total = ref(0)
const visible = ref(false)
const editingId = ref<number | null>(null)

const query = ref({
  pageNum: 1,
  pageSize: 10,
})

const form = ref({
  permissionName: '',
  permissionDisplayName: '',
  type: 2,
  parentId: 0,
  path: '',
  method: '',
})

const load = async (page = 1) => {
  query.value.pageNum = page
  const data = await request.get('/permissions/page', { params: query.value })
  list.value = data.records
  total.value = data.total
}

const openCreate = () => {
  editingId.value = null
  visible.value = true
}

const edit = (row: any) => {
  editingId.value = row.permissionId
  form.value = { ...row }
  visible.value = true
}

const submit = async () => {
  if (editingId.value) {
    await request.put(`/permissions/${editingId.value}`, form.value)
  } else {
    await request.post('/permissions', form.value)
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
