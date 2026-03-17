<script setup lang="ts">
import type { FormSchema, TableCellSlotProps, TableSchema, TTableExpose } from '@/components/business'

import type { FlowInstance } from '@/types'
import { Space, Tag } from 'antdv-next'

import {
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  XCircle,
} from 'lucide-vue-next'
import { ordersApi, serviceOrdersApi } from '@/api'
/**
 * 服务单管理页 - 使用 useMutation 重构
 *
 * @description 基于 JSON 配置化的服务单管理页面
 */
import { TBatchActions, TDataCard, TEmptyState, TForm, TModal, TPageHeader, TStatusBadge, TTable } from '@/components/business'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation, useTableData } from '@/composables'
import { createModalFormSchema } from '@/config/formConfig'
import { FLOW_STATUS, ORDER_STATUS, STATUS_CONFIG } from '@/constants'

// ==================== 数据管理 ====================
const {
  data: orders,
  loading: _loading,
  searchQuery,
  filters,
  currentPage: _currentPage,
  pageSize: _pageSize,
  total: _total,
  statistics,
  fetchData,
  goToPage,
  setPageSize,
  addData: _addData,
  updateData: _updateData,
  removeData: _removeData,
  batchRemoveData: _batchRemoveData,
} = useTableData<FlowInstance>({
  // API 调用函数
  apiCall: async (params) => {
    const res = await serviceOrdersApi.getOrders(params)
    return res || { list: [], pagination: { total: 0, currentPage: 1, pageSize: 10 } }
  },
  // 构建 API 请求参数
  apiCallParams: ctx => ({
    currentPage: ctx.currentPage,
    pageSize: ctx.pageSize,
    search: ctx.searchQuery,
    status: ctx.filters.status,
  }),

  // 统计数据计算
  statisticsFn: (items) => {
    const total = items.length
    const pending = items.filter(o => o.status === FLOW_STATUS.PENDING).length
    const processing = items.filter(o => o.status === FLOW_STATUS.WAITING).length
    const completed = items.filter(o => o.status === FLOW_STATUS.COMPLETED).length
    const cancelled = items.filter(o => o.status === FLOW_STATUS.CANCELLED).length

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
    }
  },
})

// ==================== 增删改查 ====================
const isAddDialogOpen = ref(false)
const addFormData = ref({
  customer: '',
  email: '',
  phone: '',
  address: '',
  total: 0,
  items: 1,
  status: FLOW_STATUS.PENDING,
  note: '',
})

const { mutate: createOrder } = useMutation({
  mutationFn: (values: Record<string, any>) => ordersApi.createOrder({
    customer: values.customer,
    email: values.email,
    phone: values.phone,
    address: values.address,
    total: Number(values.total),
    items: Number(values.items),
    status: values.status,
    note: values.note,
  }),
  onSuccess: () => {
    isAddDialogOpen.value = false
    addFormData.value = {
      customer: '',
      email: '',
      phone: '',
      address: '',
      total: 0,
      items: 1,
      status: FLOW_STATUS.PENDING,
      note: '',
    }
    fetchData()
  },
})

const { mutate: deleteOrder } = useMutation({
  mutationFn: (id: string) => ordersApi.deleteOrder(id),
  onSuccess: () => fetchData(),
})

// ==================== 表格配置 ====================
const tableRef = ref<TTableExpose>()

const { mutate: batchDeleteOrders } = useMutation({
  mutationFn: (ids: string[]) => ordersApi.batchDeleteOrders(ids),
  onSuccess: () => {
    tableRef.value?.clearSelection()
    fetchData()
  },
})

// ==================== 统计数据 ====================
const statisticsCards = computed(() => {
  const stats = statistics.value || {}
  return [
    {
      title: '总服务单',
      value: stats.total || 0,
      icon: ShoppingCart,
      color: 'blue',
      bgColor: 'bg-blue-50',
    },
    {
      title: '等待审核',
      value: stats.pending || 0,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
    },
    {
      title: '处理中',
      value: stats.processing || 0,
      icon: Package,
      color: 'purple',
      bgColor: 'bg-purple-50',
    },
    {
      title: '已完成',
      value: stats.completed || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
    },
  ]
})

// ==================== 搜索表单 ====================
const searchFormData = ref({
  keyword: '',
  status: '',
})

const searchSchema: FormSchema = {
  layout: 'inline',
  fields: [
    {
      name: 'keyword',
      type: 'input',
      label: '',
      placeholder: '搜索服务单号、客户...',
      className: 'w-[240px]',
    },
    {
      name: 'status',
      type: 'select',
      label: '',
      placeholder: '全部状态',
      options: [
        { label: '全部状态', value: '' },
        { label: STATUS_CONFIG.FLOW.PENDING.text, value: STATUS_CONFIG.FLOW.PENDING.value },
        { label: STATUS_CONFIG.FLOW.WAITING.text, value: STATUS_CONFIG.FLOW.WAITING.value },
        { label: STATUS_CONFIG.FLOW.COMPLETED.text, value: STATUS_CONFIG.FLOW.COMPLETED.value },
        { label: STATUS_CONFIG.FLOW.DELIVERED.text, value: STATUS_CONFIG.FLOW.DELIVERED.value },
        { label: STATUS_CONFIG.FLOW.CANCELLED.text, value: STATUS_CONFIG.FLOW.CANCELLED.value },
      ],
      className: 'w-[140px]',
    },
  ],
  searchConfig: {
    enabled: true,
    collapsed: false,
    collapseThreshold: 3,
    showCollapseButton: false,
    searchText: '搜索',
    resetText: '重置',
    showReset: true,
    onSearch: (values) => {
      searchQuery.value = values.keyword || ''
      filters.value = {
        status: values.status,
      }
    },
    onReset: () => {
      searchQuery.value = ''
      filters.value = {}
    },
  },
}

const tableSchema = computed<TableSchema>(() => ({
  columns: [
    {
      title: '服务单号',
      dataIndex: 'flowAbstract',
      width: 150,
    },
    {
      title: '服务标题',
      dataIndex: 'fullName',
      width: 180,
    },
    // {
    //   title: '提交工单',
    //   dataIndex: 'flowName',
    //   width: 100,
    // },
    {
      title: '提交时间',
      dataIndex: 'startTime',
      width: 120,
      customRender: ({ text }) => {
        return h(
          'div',
          { class: '' },
          text ? new Date(+text).toLocaleString('zh-CN') : '-',
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      slot: 'status',
      filters: [
        { text: STATUS_CONFIG.FLOW.PENDING.text, value: STATUS_CONFIG.FLOW.PENDING.value },
        { text: STATUS_CONFIG.FLOW.WAITING.text, value: STATUS_CONFIG.FLOW.WAITING.value },
        { text: STATUS_CONFIG.FLOW.COMPLETED.text, value: STATUS_CONFIG.FLOW.COMPLETED.value },
        { text: STATUS_CONFIG.FLOW.DELIVERED.text, value: STATUS_CONFIG.FLOW.DELIVERED.value },
        { text: STATUS_CONFIG.FLOW.CANCELLED.text, value: STATUS_CONFIG.FLOW.CANCELLED.value },
      ],
    },
    {
      title: '审批节点',
      dataIndex: 'thisStep',
      width: 120,
    },
    {
      title: '紧急程度',
      dataIndex: 'flowUrgent',
      width: 120,
    },
    {
      title: '处理进度',
      dataIndex: 'completion',
      slot: 'completion',
      width: 120,
    },
  ],
  pagination: {
    pageSize: 10,
    show: true,
    showSizeChanger: true,
    showQuickJumper: true,
  },
  rowSelection: {
    type: 'checkbox',
    show: true,
  },
  bordered: true,
  actions: [
    {
      text: '查看',
      type: 'primary',
      onClick: record => handleViewOrder(record as unknown as FlowInstance),
    },
    {
      text: '删除',
      type: 'danger',
      confirm: true,
      confirmText: '确定要删除该服务单吗？此操作不可恢复。',
      onClick: record => handleDeleteOrder((record as unknown as FlowInstance).id),
    },
  ],
  actionWidth: 150,
  actionFixed: 'right',
}))

// 表格数据 - 后端分页直接使用 orders
const tableData = computed(() => {
  return orders.value.map(order => ({
    ...order,
    key: order.id,
  }))
})

// ==================== 新增/查看表单 ====================
const isViewDialogOpen = ref(false)
const viewingOrder = ref<FlowInstance | null>(null)

// ==================== 新增表单 Schema ====================
const addSchema = createModalFormSchema({
  fields: [
    {
      name: 'customer',
      type: 'input',
      label: '客户姓名',
      placeholder: '请输入客户姓名',
      rules: [{ required: true, message: '客户姓名不能为空' }],
    },
    {
      name: 'email',
      type: 'input',
      label: '邮箱',
      placeholder: '请输入邮箱',
      rules: [
        { required: true, message: '邮箱不能为空' },
        { type: 'email', message: '邮箱格式不正确' },
      ],
    },
    {
      name: 'phone',
      type: 'input',
      label: '电话',
      placeholder: '请输入电话',
      rules: [{ required: true, message: '电话不能为空' }],
    },
    {
      name: 'address',
      type: 'input',
      label: '收货地址',
      placeholder: '请输入收货地址',
      rules: [{ required: true, message: '收货地址不能为空' }],
    },
    {
      name: 'total',
      type: 'number',
      label: '服务单金额',
      placeholder: '请输入服务单金额',
      rules: [{ required: true, message: '服务单金额不能为空' }],
    },
    {
      name: 'items',
      type: 'number',
      label: '商品数量',
      placeholder: '请输入商品数量',
      rules: [{ required: true, message: '商品数量不能为空' }],
    },
    {
      name: 'status',
      type: 'select',
      label: '服务单状态',
      placeholder: '请选择状态',
      options: [
        { label: STATUS_CONFIG.FLOW.PENDING.text, value: STATUS_CONFIG.FLOW.PENDING.value },
        { label: STATUS_CONFIG.FLOW.WAITING.text, value: STATUS_CONFIG.FLOW.WAITING.value },
        { label: STATUS_CONFIG.FLOW.COMPLETED.text, value: STATUS_CONFIG.FLOW.COMPLETED.value },
        { label: STATUS_CONFIG.FLOW.DELIVERED.text, value: STATUS_CONFIG.FLOW.DELIVERED.value },
        { label: STATUS_CONFIG.FLOW.CANCELLED.text, value: STATUS_CONFIG.FLOW.CANCELLED.value },
      ],
      rules: [{ required: true, message: '请选择服务单状态' }],
    },
    {
      name: 'remark',
      type: 'textarea',
      label: '备注',
      placeholder: '请输入备注（可选）',
    },
  ],
  actions: {
    submitText: '创建服务单',
    resetText: '取消',
    onReset: () => {
      isAddDialogOpen.value = false
    },
  },
})

// ==================== 事件处理 ====================

function handleViewOrder(order: FlowInstance): void {
  viewingOrder.value = order
  isViewDialogOpen.value = true
}

function handleAddSubmit(values: Record<string, any>): void {
  createOrder(values)
}

function handleDeleteOrder(id: string): void {
  deleteOrder(id)
}

const selectedRowKeys = ref<(string | number)[]>([])
const selectedRows = ref<FlowInstance[]>([])

function handleSelectChange(keys: (string | number)[], rows: any[]): void {
  selectedRowKeys.value = keys
  selectedRows.value = rows as FlowInstance[]
}

function handleClearSelection(): void {
  selectedRowKeys.value = []
  selectedRows.value = []
  tableRef.value?.clearSelection()
}

function handleBatchDelete(): void {
  if (selectedRowKeys.value.length === 0) {
    alert('请先选择要删除的服务单')
    return
  }
  if (confirm(`确定要删除选中的 ${selectedRowKeys.value.length} 个服务单吗？`)) {
    batchDeleteOrders(selectedRowKeys.value.map(String))
  }
}

/**
 * 处理表格分页、排序、筛选变化
 */
function handleTableChange(pagination: any): void {
  // 更新当前页码
  if (pagination.current !== undefined) {
    goToPage(pagination.current)
  }
  // 更新每页数量
  if (pagination.pageSize !== undefined) {
    setPageSize(pagination.pageSize)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <TPageHeader
      title="服务单管理"
      subtitle="查看和管理我的所有服务单"
      :actions="[
        { text: '创建服务单', type: 'primary', iconName: 'Plus', onClick: () => isAddDialogOpen = true },
      ]"
    />

    <!-- 新增服务单弹窗 -->
    <TModal
      v-model:open="isAddDialogOpen"
      title="创建新服务单"
      width="560"
      :footer="null"
    >
      <TForm
        v-model="addFormData"
        :schema="addSchema"
        @submit="handleAddSubmit"
      />
    </TModal>

    <!-- 统计卡片 -->
    <div class="flex flex-wrap gap-3">
      <TDataCard
        v-for="stat in statisticsCards"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
        size="sm"
      />
    </div>

    <!-- 搜索表单 -->
    <div class="bg-muted/40 border border-border/50 rounded-xl px-3 py-3">
      <TForm v-model="searchFormData" :schema="searchSchema" />
    </div>

    <!-- 服务单表格 -->
    <Card class="bg-muted/40 border border-border/50 rounded-xl">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <CardTitle class="text-base font-semibold">
              服务单列表
            </CardTitle>
            <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              共 {{ tableData.length }} 单
            </span>
          </div>
          <div class="flex items-center gap-4">
            <TBatchActions
              :count="selectedRowKeys.length"
              item-name="服务单"
              class-name="border-0 bg-transparent shadow-none px-0 py-0"
              :actions="[
                {
                  text: '批量删除',
                  type: 'danger',
                  confirm: true,
                  confirmText: '确定要删除选中的服务单吗？此操作不可恢复。',
                  onClick: handleBatchDelete,
                },
              ]"
              @clear="handleClearSelection"
            />
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign class="h-4 w-4" />
              <span>总金额: ¥{{ ((statistics.value as any)?.totalAmount ?? 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent class="pt-0">
        <TTable
          ref="tableRef"
          v-model:data="tableData"
          :schema="tableSchema"
          @select-change="handleSelectChange"
          @change="handleTableChange"
        >
          <!-- 自定义状态列 -->
          <template #status="slotProps">
            <TStatusBadge
              :status="(slotProps as TableCellSlotProps).text"
              :status-map="{
                [FLOW_STATUS.PENDING]: STATUS_CONFIG.FLOW.PENDING,
                [FLOW_STATUS.WAITING]: STATUS_CONFIG.FLOW.WAITING,
                [FLOW_STATUS.COMPLETED]: STATUS_CONFIG.FLOW.COMPLETED,
                [FLOW_STATUS.DELIVERED]: STATUS_CONFIG.FLOW.DELIVERED,
                [FLOW_STATUS.CANCELLED]: STATUS_CONFIG.FLOW.CANCELLED,
              }"
            />
          </template>

          <!-- 审批进度 -->
          <template #completion="slotProps">
            <a-progress :percent="(slotProps as TableCellSlotProps).text" />
          </template>

          <!-- 空状态 -->
          <template #emptyText>
            <TEmptyState
              type="data"
              title="暂无服务单数据"
              description="开始创建您的第一个服务单吧"
              :action="{ text: '创建服务单', type: 'primary', iconName: 'Plus', onClick: () => isAddDialogOpen = true }"
            />
          </template>
        </TTable>
      </CardContent>
    </Card>

    <!-- 查看服务单弹窗 -->
  </div>
</template>
