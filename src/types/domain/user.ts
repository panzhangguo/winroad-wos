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

/**
 * 更新个人资料参数
 */
export interface UpdateProfileParams {
  name?: string
  phone?: string
  address?: string
  department?: string
  position?: string
  bio?: string
  avatar?: string
}

/**
 * 用户列表查询参数
 */
export interface GetUsersParams {
  page?: number
  pageSize?: number
  keyword?: string
  role?: UserRole
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
