<script setup lang="ts">
import type { UserProfile } from '@/types'
import { message } from 'antdv-next'
import { md5 } from 'js-md5'
import {
  Calendar,
  FileText,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Save,
  Shield,
  Upload,
  User,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { authApi, usersApi } from '@/api'
import { TPageHeader } from '@/components/business'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/global/auth'

/**
 * 路由实例
 */
const router = useRouter()
const authStore = useAuthStore()

/** 表单验证错误 */
const formErrors = reactive<Record<string, string>>({})

/** 个人资料表单 */
const profileForm = reactive<Partial<UserProfile>>({
  realName: '',
  account: '',
  telePhone: '',
  avatar: '',
  postalAddress: '',
  position: '',
  creatorTime: 0,
  email: '',
  organize: '',
})

/** 加载状态 */
const loadingStates = reactive({
  profile: false,
  avatar: false,
  password: false,
})

/** 密码修改弹窗 */
const passwordDialog = reactive({
  open: false,
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  code: '',
  timestamp: '',
})

/** 密码错误 */
const passwordErrors = reactive<Record<string, string>>({})

/** 头像文件输入引用 */
const avatarInputRef = ref<HTMLInputElement | null>(null)

/**
 * 初始化表单数据
 */
async function initProfileForm() {
  const user = await usersApi.getUserBaseInfo()
  // const user = authStore.user
  if (user) {
    profileForm.realName = user.realName || ''
    profileForm.account = user.account || ''
    profileForm.telePhone = user.telePhone || ''
    profileForm.avatar = user.avatar || ''
    profileForm.postalAddress = user.postalAddress || ''
    profileForm.position = user.position || ''
    profileForm.creatorTime = user.creatorTime || 0
    profileForm.email = user.email || ''
    profileForm.organize = user.organize || ''
    profileForm.signature = user.signature || ''
  }
}

/**
 * 验证个人资料表单
 */
function validateProfileForm(): boolean {
  formErrors.name = ''
  formErrors.phone = ''
  formErrors.email = ''

  let isValid = true

  if (!profileForm.realName.trim()) {
    formErrors.realName = '请输入姓名'
    isValid = false
  }
  else if (profileForm.realName.length < 2 || profileForm.realName.length > 20) {
    formErrors.realName = '姓名长度应在 2-20 个字符之间'
    isValid = false
  }

  // eslint-disable-next-line e18e/prefer-static-regex
  if (profileForm.telePhone && !/^1[3-9]\d{9}$/.test(profileForm.telePhone)) {
    formErrors.telePhone = '请输入有效的手机号码'
    isValid = false
  }

  // eslint-disable-next-line e18e/prefer-static-regex
  if (profileForm.email && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(profileForm.email)) {
    formErrors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  return isValid
}

/**
 * 保存个人资料
 */
async function handleSaveProfile() {
  if (!validateProfileForm()) {
    return
  }

  loadingStates.profile = true
  try {
    await authApi.updateProfile({
      realName: profileForm.realName,
      telePhone: profileForm.telePhone,
      postalAddress: profileForm.postalAddress,
      signature: profileForm.signature,
      email: profileForm.email,
    })

    // 更新 store 中的用户信息
    if (authStore.user) {
      Object.assign(authStore.user, {
        userAccount: profileForm.account,
        userName: profileForm.realName,
      })
    }

    message.success('个人资料保存成功')
  }
  catch (error) {
    console.error('保存个人资料失败:', error)
    message.error('保存失败，请稍后重试')
  }
  finally {
    loadingStates.profile = false
  }
}

/**
 * 触发头像上传
 */
function handleAvatarClick() {
  avatarInputRef.value?.click()
}

/**
 * 处理头像文件选择
 */
async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file)
    return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return
  }

  // 验证文件大小（最大 2MB）
  if (file.size > 2 * 1024 * 1024) {
    message.error('图片大小不能超过 2MB')
    return
  }

  loadingStates.avatar = true
  try {
    const result = await authApi.uploadAvatar(file) as { url: string, name: string }
    const avatarUrl = result.url
    profileForm.avatar = avatarUrl

    // 同时更新用户资料
    await authApi.updateProfileAvatar(result.name)

    // 更新 store
    if (authStore.user) {
      authStore.user.headIcon = avatarUrl
    }

    message.success('头像上传成功')
  }
  catch (error) {
    console.error('上传头像失败:', error)
    message.error('上传失败，请稍后重试')
  }
  finally {
    loadingStates.avatar = false
    // 清空 input 值，允许重复选择同一文件
    if (avatarInputRef.value) {
      avatarInputRef.value.value = ''
    }
  }
}

/**
 * 验证码图片URL
 */
const captchaUrl = ref('')

/**
 * 打开修改密码弹窗
 */
function handleOpenPasswordDialog() {
  passwordDialog.open = true
  passwordDialog.oldPassword = ''
  passwordDialog.newPassword = ''
  passwordDialog.confirmPassword = ''
  passwordDialog.code = ''

  passwordErrors.oldPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''
  passwordErrors.code = ''
  passwordDialog.timestamp = ''

  refreshCaptcha()
}

/**
 * 刷新验证码
 */
async function refreshCaptcha() {
  // 这里需要调用后端API获取验证码图片
  // 示例: captchaUrl.value = `/api/auth/captcha?${Date.now()}`
  // 暂时使用占位符
  const timestamp = `${Math.random()}`
  passwordDialog.timestamp = timestamp
  captchaUrl.value = `/api/oauth/ImageCode/3/${timestamp}`
}

/**
 * 验证密码表单
 */
function validatePasswordForm(): boolean {
  passwordErrors.oldPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''

  let isValid = true

  if (!passwordDialog.oldPassword) {
    passwordErrors.oldPassword = '请输入当前密码'
    isValid = false
  }

  if (!passwordDialog.newPassword) {
    passwordErrors.newPassword = '请输入新密码'
    isValid = false
  }
  else if (passwordDialog.newPassword.length < 6) {
    passwordErrors.newPassword = '密码长度至少为 6 位'
    isValid = false
  }

  if (!passwordDialog.confirmPassword) {
    passwordErrors.confirmPassword = '请确认新密码'
    isValid = false
  }
  else if (passwordDialog.newPassword !== passwordDialog.confirmPassword) {
    passwordErrors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

/**
 * 修改密码
 */
async function handleChangePassword() {
  if (!validatePasswordForm()) {
    return
  }

  loadingStates.password = true
  try {
    await authApi.changePassword({
      oldPassword: md5(passwordDialog.oldPassword),
      password: md5(passwordDialog.newPassword),
      code: passwordDialog.code,
      timestamp: passwordDialog.timestamp,
    })

    message.success('密码修改成功')
    passwordDialog.open = false
    // 修改成功后，需要重新登录才能生效
    authStore.logout()
    router.push('/login')
  }
  catch (error) {
    console.error('修改密码失败:', error)
    message.error('修改密码失败，请检查当前密码是否正确')
  }
  finally {
    loadingStates.password = false
  }
}

/** 获取用户首字母 */
const userInitials = computed(() => {
  return profileForm.realName?.charAt(0).toUpperCase() || 'U'
})

/** 格式化日期 */
function formatDate(dateString?: number) {
  if (!dateString)
    return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

onMounted(() => {
  initProfileForm()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <TPageHeader
      title="个人资料"
      subtitle="管理您的个人信息和账户安全"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：个人资料编辑 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 基本信息卡片 -->
        <Card class="bg-muted/40 border border-border/50 rounded-xl">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <User class="h-5 w-5" />
              基本信息
            </CardTitle>
            <CardDescription>更新您的个人信息</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- 头像上传 -->
            <div class="flex items-center gap-4">
              <div class="relative">
                <Avatar class="h-24 w-24">
                  <AvatarImage v-if="profileForm.avatar" :src="profileForm.avatar" />
                  <AvatarFallback class="text-3xl bg-primary text-primary-foreground">
                    {{ userInitials }}
                  </AvatarFallback>
                </Avatar>
                <button
                  v-if="loadingStates.avatar"
                  class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
                >
                  <Loader2 class="h-8 w-8 text-white animate-spin" />
                </button>
              </div>
              <div>
                <input
                  ref="avatarInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleAvatarChange"
                >
                <Button
                  variant="outline"
                  :disabled="loadingStates.avatar"
                  @click="handleAvatarClick"
                >
                  <Upload class="h-4 w-4 mr-2" />
                  更换头像
                </Button>
                <p class="text-xs text-muted-foreground mt-2">
                  支持 JPG、PNG 格式，文件大小不超过 2MB
                </p>
              </div>
            </div>

            <Separator />

            <!-- 基本信息表单 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 姓名 -->
              <div class="space-y-2">
                <Label for="name">
                  姓名
                  <span class="text-destructive">*</span>
                </Label>
                <Input
                  id="realName"
                  v-model="profileForm.realName"
                  :class="{ 'border-destructive': formErrors.realName }"
                  placeholder="请输入姓名"
                />
                <p v-if="formErrors.realName" class="text-xs text-destructive">
                  {{ formErrors.realName }}
                </p>
              </div>

              <!-- 邮箱 -->
              <div class="space-y-2">
                <Label for="email">邮箱</Label>
                <Input
                  id="email"
                  v-model="profileForm.email"
                  type="email"
                />
              </div>

              <!-- 电话 -->
              <div class="space-y-2">
                <Label for="phone">电话</Label>
                <Input
                  id="telePhone"
                  v-model="profileForm.telePhone"
                  type="tel"
                  :class="{ 'border-destructive': formErrors.telePhone }"
                  placeholder="请输入手机号码"
                />
                <p v-if="formErrors.telePhone" class="text-xs text-destructive">
                  {{ formErrors.telePhone }}
                </p>
              </div>

              <!-- 地址 -->
              <div class="space-y-2">
                <Label for="address">
                  <MapPin class="h-3.5 w-3.5 inline mr-1" />
                  地址
                </Label>
                <Input
                  id="address"
                  v-model="profileForm.postalAddress"
                  placeholder="请输入地址"
                />
              </div>
            </div>

            <!-- 个人简介 -->
            <div class="space-y-2">
              <Label for="bio">
                <FileText class="h-3.5 w-3.5 inline mr-1" />
                个人简介
              </Label>
              <textarea
                id="bio"
                v-model="profileForm.signature"
                rows="4"
                class="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="请输入个人简介"
              />
            </div>

            <div class="flex justify-end">
              <Button
                :disabled="loadingStates.profile"
                @click="handleSaveProfile"
              >
                <Loader2 v-if="loadingStates.profile" class="h-4 w-4 mr-2 animate-spin" />
                <Save v-else class="h-4 w-4 mr-2" />
                {{ loadingStates.profile ? '保存中...' : '保存更改' }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 右侧：账户信息 -->
      <div class="space-y-6">
        <!-- 账户信息卡片 -->
        <Card class="bg-muted/40 border border-border/50 rounded-xl">
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center gap-3 text-sm">
              <Mail class="h-4 w-4 text-muted-foreground" />
              <div>
                <p class="text-xs text-muted-foreground">
                  账号
                </p>
                <p>{{ authStore.user?.userAccount }}</p>
              </div>
            </div>
            <Separator />
            <div class="flex items-center gap-3 text-sm">
              <Shield class="h-4 w-4 text-muted-foreground" />
              <div>
                <p class="text-xs text-muted-foreground">
                  角色
                </p>
                <p>{{ authStore.user?.roleName }}</p>
              </div>
            </div>
            <Separator />
            <div class="flex items-center gap-3 text-sm">
              <User class="h-4 w-4 text-muted-foreground" />
              <div>
                <p class="text-xs text-muted-foreground">
                  所属组织
                </p>
                <p>{{ profileForm.organize }}</p>
              </div>
            </div>
            <Separator />
            <div class="flex items-center gap-3 text-sm">
              <Calendar class="h-4 w-4 text-muted-foreground" />
              <div>
                <p class="text-xs text-muted-foreground">
                  注册时间
                </p>
                <p>{{ formatDate(profileForm.creatorTime) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 安全设置卡片 -->
        <Card class="bg-muted/40 border border-border/50 rounded-xl">
          <CardHeader>
            <CardTitle>安全设置</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button
              variant="outline"
              class="w-full"
              @click="handleOpenPasswordDialog"
            >
              <Lock class="h-4 w-4 mr-2" />
              修改密码
            </Button>
          </CardContent>
        </Card>

        <!-- 危险区域卡片 -->
        <!-- <Card class="bg-muted/40 border border-border/50 rounded-xl border-destructive/50">
          <CardHeader>
            <CardTitle class="text-destructive">
              危险区域
            </CardTitle>
            <CardDescription>不可逆的操作</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" class="w-full">
              删除账户
            </Button>
          </CardContent>
        </Card> -->
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <Dialog v-model:open="passwordDialog.open">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Lock class="h-5 w-5" />
            修改密码
          </DialogTitle>
          <DialogDescription>
            请输入当前密码和新密码来修改您的登录密码
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="oldPassword">
              当前密码
              <span class="text-destructive">*</span>
            </Label>
            <Input
              id="oldPassword"
              v-model="passwordDialog.oldPassword"
              type="password"
              :class="{ 'border-destructive': passwordErrors.oldPassword }"
              placeholder="请输入当前密码"
            />
            <p v-if="passwordErrors.oldPassword" class="text-xs text-destructive">
              {{ passwordErrors.oldPassword }}
            </p>
          </div>
          <div class="space-y-2">
            <Label for="newPassword">
              新密码
              <span class="text-destructive">*</span>
            </Label>
            <Input
              id="newPassword"
              v-model="passwordDialog.newPassword"
              type="password"
              :class="{ 'border-destructive': passwordErrors.newPassword }"
              placeholder="请输入新密码（至少6位）"
            />
            <p v-if="passwordErrors.newPassword" class="text-xs text-destructive">
              {{ passwordErrors.newPassword }}
            </p>
          </div>
          <div class="space-y-2">
            <Label for="confirmPassword">
              确认新密码
              <span class="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              v-model="passwordDialog.confirmPassword"
              type="password"
              :class="{ 'border-destructive': passwordErrors.confirmPassword }"
              placeholder="请再次输入新密码"
            />
            <p v-if="passwordErrors.confirmPassword" class="text-xs text-destructive">
              {{ passwordErrors.confirmPassword }}
            </p>
          </div>
          <!-- 验证码 -->
          <div class="space-y-2">
            <Label for="verifyCode">
              验证码
              <span class="text-destructive">*</span>
            </Label>
            <div class="flex items-center gap-3">
              <Input
                id="verifyCode"
                v-model="passwordDialog.code"
                type="text"
                :class="{ 'border-destructive': passwordErrors.verifyCode }"
                placeholder="请输入验证码"
              />
              <p v-if="passwordErrors.verifyCode" class="text-xs text-destructive">
                {{ passwordErrors.verifyCode }}
              </p>
              <img
                :src="captchaUrl"
                alt="验证码"
                class="h-9 w-24 object-cover rounded-md cursor-pointer"
                :style="{ borderRadius: `calc(var(--radius))` }"
                @click="refreshCaptcha"
              >
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="passwordDialog.open = false">
            取消
          </Button>
          <Button
            :disabled="loadingStates.password"
            @click="handleChangePassword"
          >
            <Loader2 v-if="loadingStates.password" class="h-4 w-4 mr-2 animate-spin" />
            {{ loadingStates.password ? '修改中...' : '确认修改' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
