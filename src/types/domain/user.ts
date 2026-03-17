/**
 * 用户领域类型定义
 */

import type { USER_ROLES, USER_STATUS } from '@/constants'

/** 用户角色类型 */
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

/** 用户状态类型 */
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS]

/** 系统项 */
export interface UserSystemItem {
  id: string
  enCode: string
  name: string
  icon: string
  currentSystem: boolean
  sortCode: number
}

/**
 * 用户基础信息
 */
export interface User {
  userId: string
  userAccount: string
  userName: string
  headIcon: string
  gender: number
  landline: string
  telePhone: string
  organizeId: string
  organizeName: string
  managerId: string
  subsidiary: string[]
  subordinates: any[] // 原数据为空数组，若确定只存ID可改为 string[]
  positionIds: string[] | null
  positionName: string | null
  positionId: string | null
  roleId: string // 注意：原数据是逗号分隔的字符串 "id1,id2"
  roleName: string // 注意：原数据是逗号分隔的字符串 "name1,name2"
  roleIds: string[]
  loginTime: number
  loginIPAddress: string
  loginIPAddressName: string
  MACAddress: string | null
  loginPlatForm: string
  prevLogin: number
  prevLoginTime: number
  prevLoginIPAddress: string
  prevLoginIPAddressName: string
  isAdministrator: boolean
  overdueTime: string
  tenantId: string
  tenantDbName: string
  tenantDbType: string | null
  portalId: string
  dataScope: any[] // 原数据为空数组，视业务逻辑可能为 string[] 或 number[]
  manager: any | null // 原数据为 null，若有具体结构需补充
  mobilePhone: string
  email: string
  birthday: number
  departmentId: string
  departmentName: string | null
  systemId: string
  signImg: string | null
  theme: string
  language: string | null
  themeClass: string | null
  layoutType: string | null
  slideClass: string | null
  tagsIcon: boolean
  showLanguage: boolean
  showSearch: boolean
  useCache: boolean
  uniqueOpened: boolean
  tagsView: boolean
  systemIds: UserSystemItem[]
}

export interface UserProfile {
  id: string
  account: string
  realName: string
  organizeId: string
  organize: string // 例如: "顶层组织/客户"
  position: string // 原数据为空字符串
  manager: string // 原数据格式: "姓名/账号"
  roleId: string // 原数据为逗号分隔的角色名: "客户,普通用户"
  creatorTime: number // 时间戳
  prevLogTime: number // 时间戳
  signature: string | null
  gender: string // 原数据为字符串 "3"
  nation: string
  nativePlace: string
  entryDate: number // 时间戳
  certificatesType: string
  certificatesNumber: string
  education: string
  birthday: number // 时间戳
  telePhone: string
  landline: string
  mobilePhone: string
  email: string
  urgentContacts: string
  urgentTelePhone: string
  postalAddress: string
  theme: string // 颜色值 "#1890ff"
  language: string | null
  avatar: string // 图片路径
  themeClass: string | null
  layoutType: string | null
  slideClass: string | null
  tagsIcon: boolean
  showLanguage: boolean
  showSearch: boolean
  useCache: boolean
  uniqueOpened: boolean
  tagsView: boolean
  positionId: string
  roleIds: string // 原数据为逗号分隔的ID: "id1,id2"
}

/**
 * 更新个人资料参数
 */
export interface UpdateProfileParams {
  realName?: string
  signature?: string
  telePhone?: string
  email?: string
  postalAddress?: string
  position?: string
}

/**
 * 用户列表查询参数
 */
export interface GetUsersParams {
  page?: number
  pageSize?: number
  keyword?: string
  role?: UserRole
  search?: string
  status?: UserStatus
}

/**
 * 创建用户参数
 */
export interface CreateUserParams {
  email: string
  name: string
  password?: string
  role?: UserRole
  status?: UserStatus
  avatar?: string
}

/**
 * 更新用户参数
 */
export interface UpdateUserParams {
  name?: string
  email?: string
  avatar?: string
  role?: UserRole
  status?: UserStatus
}

/**
 * 修改密码参数
 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}
