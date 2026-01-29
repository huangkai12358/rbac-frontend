<template>
  <!-- 查询区 -->
  <el-form :inline="true" class="query-form">
    <el-form-item label="用户名">
      <el-input
        v-model="query.username"
        placeholder="用户名"
        clearable
      />
    </el-form-item>

    <el-form-item label="权限名">
      <el-input
        v-model="query.permissionName"
        placeholder="权限名"
        clearable
      />
    </el-form-item>

    <el-form-item label="结果">
      <el-select v-model="query.success" placeholder="全部" clearable>
        <el-option label="成功" :value="1" />
        <el-option label="失败" :value="0" />
      </el-select>
    </el-form-item>

    <el-form-item label="时间">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="load(1)">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>

  <!-- 表格 -->
  <el-table :data="list" border style="margin-top: 12px">
    <el-table-column prop="logSeq" label="序号" width="60" />
    <el-table-column prop="username" label="用户" width="100" />

    <el-table-column prop="permissionName" label="权限" width="200">
      <template #default="{ row }">
        <el-tag v-if="row.permissionName">
          {{ row.permissionName }}
        </el-tag>
        <span v-else>-</span>
      </template>
    </el-table-column>

    <el-table-column prop="path" label="路径" width = "220" />
    <el-table-column prop="method" label="方法" width="90">
      <template #default="{ row }">
        <el-tag
          :type="row.method === 'GET' ? 'success' : 'warning'"
        >
          {{ row.method }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="requestBody" label="请求体"  />
    <el-table-column prop="ip" label="IP" width="140" />

    <el-table-column label="结果" width="70">
      <template #default="{ row }">
        <el-tag :type="row.success === 1 ? 'success' : 'danger'">
          {{ row.success === 1 ? '成功' : '失败' }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="errorMessage" label="错误信息" width="230"/>
    <el-table-column prop="createTime" label="时间" width="170" />
  </el-table>

  <!-- 分页 -->
  <el-pagination
    style="margin-top: 12px"
    background
    layout="prev, pager, next"
    :total="total"
    :page-size="query.pageSize"
    @current-change="load"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import request from '@/utils/request'
import type { AuditLog, AuditLogQuery } from '@/types/audit'
import type { PageResult } from '@/types/page'

/* 表格数据 */
const list = ref<any[]>([])
const total = ref(0)

/* 查询条件 */
const query = ref<AuditLogQuery>({
  pageNum: 1,
  pageSize: 20,
  username: '',
  permissionName: '',
  success: null as number | null,
  startDate: null as string | null,
  endDate: null as string | null,
})

/* 时间区间 */
const dateRange = ref<[string, string] | null>(null) // 明确告诉 TS：dateRange 要么 null，要么一定有两个 string。dateRange.value[0] 不再可能是 undefined

/* 加载数据 */
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

/* 重置查询 */
const reset = () => {
  query.value = {
    pageNum: 1,
    pageSize: 20,
    username: '',
    permissionName: '',
    success: null,
    startDate: null,
    endDate: null,
  }
  dateRange.value = null
  load(1)
}

/* 初始加载 */
load()
</script>

<style scoped>
.query-form {
  margin-bottom: 12px;
}
</style>
