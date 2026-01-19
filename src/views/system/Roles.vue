<template>
  <el-button
    type="primary"
    v-permission="'ROLE:CREATE'"
    @click="openCreate"
  >
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

    <el-table-column label="操作">
      <template #default="{ row }">
        <el-button
          size="small"
          v-permission="'ROLE:EDIT'"
          @click="edit(row)"
        >
          编辑
        </el-button>
        <el-button
          size="small"
          v-permission="'ROLE:STATUS'"
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
  roleName: '',
  roleDisplayName: '',
  description: '',
})

const load = async (page = 1) => {
  query.value.pageNum = page
  const data = await request.get('/roles/page', { params: query.value })
  list.value = data.records
  total.value = data.total
}

const openCreate = () => {
  editingId.value = null
  form.value = { roleName: '', roleDisplayName: '', description: '' }
  visible.value = true
}

const edit = (row: any) => {
  editingId.value = row.roleId
  form.value = { ...row }
  visible.value = true
}

const submit = async () => {
  if (editingId.value) {
    await request.put(`/roles/${editingId.value}`, form.value)
  } else {
    await request.post('/roles', form.value)
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

load()
</script>
