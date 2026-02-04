<template>
  <!-- 查询区 -->
  <el-form :inline="true" @submit.prevent>
    <el-form-item label="序号">
      <el-input v-model="query.logSeq" placeholder="序号" clearable style="width: 80px" @keyup.enter="load(1)" />
    </el-form-item>

    <el-form-item label="用户名">
      <el-input v-model="query.username" placeholder="用户名" clearable style="width: 120px" @keyup.enter="load(1)" />
    </el-form-item>

    <el-form-item label="权限名">
      <el-input v-model="query.permissionName" placeholder="权限名" clearable style="width: 150px" @keyup.enter="load(1)" />
    </el-form-item>

    <el-form-item label="结果">
      <el-select v-model="query.success" placeholder="全部" clearable style="width: 80px">
        <el-option label="成功" :value="1" />
        <el-option label="失败" :value="0" />
      </el-select>
    </el-form-item>

    <el-form-item label="时间">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
        end-placeholder="结束日期" value-format="YYYY-MM-DD" unlink-panels />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="load(1)">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>

  <!-- 导出数据 -->
  <div class="toolbar">
    <el-button type="primary" @click="exportExcel">导出数据</el-button>
  </div>

  <!-- 表格 -->
  <el-table :data="list" border style="margin-top: 22px" @sort-change="handleSortChange">
    <el-table-column prop="logSeq" label="序号" width="80" sortable="custom" />
    <el-table-column prop="username" label="用户名" sortable="custom" />

    <el-table-column prop="permissionName" label="权限名" width="200" sortable="custom">
      <template #default="{ row }">
        <el-tag v-if="row.permissionName">
          {{ row.permissionName }}
        </el-tag>
        <span v-else>-</span>
      </template>
    </el-table-column>

    <el-table-column prop="path" label="路径" width="220" sortable="custom" />
    <el-table-column prop="method" label="方法" width="80" sortable="custom">
      <template #default="{ row }">
        <el-tag :type="row.method === 'GET' ? 'success' : 'warning'">
          {{ row.method }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="requestBody" label="请求体">
      <template #default="{ row }">
        <div style="white-space: pre-line;"> <!-- 把 \n 当场换行符显示，合并多个空格 -->
          {{ row.requestBody }}
        </div>
      </template>
    </el-table-column>

    <el-table-column prop="ip" label="IP 地址" width="140" sortable="custom" />

    <el-table-column prop="success" label="结果" width="80" sortable="custom">
      <template #default="{ row }">
        <el-tag :type="row.success === 1 ? 'success' : 'danger'">
          {{ row.success === 1 ? '成功' : '失败' }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="errorMessage" label="错误信息" />
    <el-table-column prop="createTime" label="操作时间" width="170" sortable="custom" />
  </el-table>

  <!-- 分页 -->
  <el-pagination style="margin-top: 12px" background layout="sizes, prev, pager, next, jumper, ->, total" :total="total"
    :page-size="query.pageSize" :page-sizes="[10, 20, 50, 100]" :current-page="query.pageNum"
    @size-change="handleSizeChange" @current-change="load" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import request from '@/utils/request'
import type { AuditLog } from '@/types/audit'
import type { PageResult } from '@/types/page'

/* 表格数据 */
const list = ref<any[]>([])
const total = ref(0)

/* 查询条件 */
const query = ref({
  pageNum: 1,
  pageSize: 10,
  logSeq: null as number | null,
  username: '',
  permissionName: '',
  success: null as number | null,
  startDate: null as string | null,
  endDate: null as string | null,
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

/* 时间区间 */
const dateRange = ref<[string, string] | null>(null) // 明确告诉 TS：dateRange 要么 null，要么一定有两个 string。dateRange.value[0] 不再可能是 undefined

/* 加载审计日志 */
const load = async (page = 1) => {
  query.value.pageNum = page

  if (dateRange.value) {
    query.value.startDate = dateRange.value[0]
    query.value.endDate = dateRange.value[1]
  } else {
    query.value.startDate = null
    query.value.endDate = null
  }

  const data = await request.get('/audit-logs/page', {
    params: query.value,
  }) as PageResult<AuditLog>

  list.value = data.records
  total.value = data.total
}

// 监听 pageSize 变化
const handleSizeChange = async (size: number) => {
  query.value.pageSize = size
  query.value.pageNum = 1
  load(1)
}

/* 重置查询 */
const reset = () => {
  query.value = {
    pageNum: 1,
    pageSize: 10,
    logSeq: null,
    username: '',
    permissionName: '',
    success: null,
    startDate: null,
    endDate: null,
    sortField: '',
    sortOrder: '',
  }
  dateRange.value = null
  load(1)
}

/* 导出 Excel */
const exportExcel = async () => {
  const res = await request.get('/audit-logs/export', {
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
  a.download = '审计日志.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}

/* 初始加载 */
load()
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin: 10px 0
}
</style>
