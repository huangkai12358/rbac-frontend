<template>
  <!-- 查询区 -->
  <el-form inline @submit.prevent> <!--在 <el-form> 里按 Enter，浏览器会默认“提交表单并刷新页面”。submit：监听表单提交 .prevent：阻止默认行为（刷新页面）-->
    <el-form-item>
      <el-input v-model="query.permissionName" placeholder="权限名" clearable @keyup.enter="load(1)" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="load(1)">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>

  <!-- 操作区 -->
  <el-button type="primary" v-permission="'PERMISSION:CREATE'" @click="openCreate">
    新建权限
  </el-button>

  <!-- 表格 -->
  <el-table :data="list" border style="margin-top: 12px" @sort-change="handleSortChange">
    <el-table-column prop="permissionId" label="ID" width="80" sortable="custom" />
    <el-table-column prop="permissionName" label="权限标识" sortable="custom" />
    <el-table-column prop="permissionDisplayName" label="权限名称" />
    <el-table-column prop="type" label="类型" width="80" sortable="custom" />
    <el-table-column prop="path" label="路径" sortable="custom" />
    <el-table-column prop="method" label="方法" width="80" sortable="custom" />
    <el-table-column prop="createTime" label="创建时间" width="170" sortable="custom" />

    <el-table-column prop="status" label="状态" width="80" sortable="custom">
      <template #default="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="140">
      <template #default="{ row }">
        <el-button size="small" type="primary" v-permission="'PERMISSION:UPDATE'" @click="edit(row)">
          编辑
        </el-button>
        <el-button size="small" type="danger" v-permission="'PERMISSION:STATUS'" @click="toggle(row)">
          {{ row.status === 1 ? '禁用' : '启用' }}
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 分页 -->
  <el-pagination style="margin-top: 12px" background :total="total" :page-size="query.pageSize" @current-change="load" />


  <!-- 新建 / 编辑弹窗 -->
  <el-dialog v-model="visible" title="权限">
    <el-form ref="formRef" :model="form" :rules="editingId ? {} : rules" label-width="100px">
      <el-form-item label="权限标识" prop="permissionName" :required="!editingId">
        <el-input v-model="form.permissionName" />
      </el-form-item>
      <el-form-item label="权限名称" prop="permissionDisplayName" :required="!editingId">
        <el-input v-model="form.permissionDisplayName" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" />
      </el-form-item>
      <el-form-item label="类型" prop="type" :required="!editingId">
        <el-input-number v-model="form.type" />
      </el-form-item>
      <el-form-item label="父权限ID" prop="parentId" :required="!editingId">
        <el-input-number v-model="form.parentId" />
      </el-form-item>
      <el-form-item label="路径">
        <el-input v-model="form.path" />
      </el-form-item>
      <el-form-item label="方法">
        <el-input v-model="form.method" />
      </el-form-item>
      <el-form-item label="排序" prop="sort" :required="!editingId">
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

/* 表格数据 */
const list = ref<any[]>([])
const total = ref(0)

/* 查询条件 */
const query = ref({
  pageNum: 1,
  pageSize: 10,
  permissionName: '',
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

/* 加载权限 */
const load = async (page = 1) => {
  query.value.pageNum = page
  const data = await request.get('/permissions/page', { params: query.value }) as PageResult<Permission>
  list.value = data.records
  total.value = data.total
}

/* 重置查询 */
const reset = () => {
  query.value = {
    pageNum: 1,
    pageSize: 10,
    permissionName: '',
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

/* 编辑 */
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

// 规则：新建权限：新建权限，权限标识、权限名称、类型、父权限ID、排序必填
import type { FormRules, FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()

const rules: FormRules = {
  permissionName: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
  ],
  permissionDisplayName: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' },
  ],
  parentId: [
    { required: true, message: '请输入父权限ID', trigger: 'change' },
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'change' },
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

/* 启用 / 禁用 */
const toggle = async (row: any) => {
  await request.put(`/permissions/${row.permissionId}/status`, {
    status: row.status === 1 ? 0 : 1,
  })
  load()
}

/* 初始加载 */
load()
</script>
