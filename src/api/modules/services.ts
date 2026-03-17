import type { Order, PaginationData } from '@/types'
/**
 * 服务单管理相关 API
 * @description 服务单的增删改查等接口
 */
import { request } from '../client'

/**
 * 创建服务单参数
 */
export interface CreateServicesOrderParams {
  customer: string
  email: string
  phone: string
  items: number
  address: string
  total?: number
  status?: string
  note?: string
}

/**
 * 更新服务单参数
 */
export interface UpdateServicesOrderParams {
  customer?: string
  email?: string
  phone?: string
  address?: string
  note?: string
}

/**
 * 查询服务单列表参数
 */
export interface GetServicesOrdersParams {
  currentPage: number
  pageSize: number
  sort: string
  desc: boolean
  sidx: string
  keyword: string
  startTime: string
  endTime: string
  flowId: string
  status: string
  flowUrgent: string
  flowCategory: string
  flowAbstract: string
}

/**
 * 服务单 API
 */
export const serviceOrdersApi = {
  /**
   * 获取我的服务单列表
   * @param params - 查询参数
   * @returns 分页服务单列表
   */
  getOrders: (params: Partial<GetServicesOrdersParams>) =>
    request.get<PaginationData<Order>>('/workflow/Engine/FlowLaunch', {
      params,
    }),

  /**
   * 根据 ID 获取服务单详情
   * @param id - 服务单 ID
   * @returns 服务单详情
   */
  getOrderById: (id: string) => request.get<Order>(`/orders/${id}`),

  /**
   * 创建服务单
   * @param data - 服务单数据
   * @returns 创建的服务单
   */
  createOrder: (data: CreateServicesOrderParams) =>
    request.post<Order>('/orders', data),

  /**
   * 更新服务单
   * @param id - 服务单 ID
   * @param data - 更新数据
   * @returns 更新后的服务单
   */
  updateOrder: (id: string, data: UpdateServicesOrderParams) =>
    request.put<Order>(`/orders/${id}`, data),

  /**
   * 删除服务单
   * @param id - 服务单 ID
   * @returns 删除结果
   */
  deleteOrder: (id: string) => request.delete<void>(`/orders/${id}`),

  /**
   * 批量删除服务单
   * @param ids - 服务单 ID 数组
   * @returns 删除结果
   */
  batchDeleteOrders: (ids: string[]) =>
    request.post<void>('/orders/batch-delete', { ids }),

  /**
   * 更新服务单状态
   * @param id - 服务单 ID
   * @param status - 新状态
   * @returns 更新结果
   */
  updateOrderStatus: (id: string, status: Order['status']) =>
    request.patch<Order>(`/orders/${id}/status`, { status }),
}
