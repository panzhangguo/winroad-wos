export interface FlowInstance {
  enCode: string | null
  creatorUserId: string
  creatorTime: number // 创建时间戳
  thisStep: string // 当前节点名称，如 "需求初审"
  flowUrgent: number // 紧急程度 (1, 2, 3...)
  flowCategory: string // 流程分类ID
  fullName: string // 工单标题
  flowName: string // 流程名称
  status: number // 流程状态 (1: 进行中, 2: 已完成, etc.)
  startTime: number // 开始时间戳
  id: string // 实例ID
  endTime: number | null // 结束时间戳 (未完成时为 null)
  completion: number // 完成进度百分比 (0-100)
  description: string | null
  flowCode: string // 流程编码，如 "Flow_WorkOrder"
  flowId: string // 流程模板ID
  formType: number // 表单类型
  templateId: string // 模板ID
  delegateId: string // 委托人ID ("0" 表示无委托)
  sortCode: number | null
  delegateUser: any | null // 委托人详细信息 (原数据为 null，若有结构需补充)
  flowAbstract: string // 流程摘要/单号
}
