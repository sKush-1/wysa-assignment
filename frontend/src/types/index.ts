export interface Option {
  id: string
  text: string
  nextQuestionId: string | null
}

export interface Question {
  id: string
  moduleId: string
  text: string
  isCheckpoint: boolean
  options: Option[]
}

export interface Module {
  id: string
  name: string
  description?: string | null
  visited?: boolean
  _count?: {
    questions: number
  }
}

export interface FlowState {
  id: string
  userId: string
  currentModuleId: string
  currentQuestionId: string
  breadcrumbTrail: string[]
  updatedAt: string
}

export interface FlowHistoryEntry {
  id: string
  userId: string
  questionId: string
  optionId: string
  createdAt: string
  question: {
    id: string
    text: string
    isCheckpoint: boolean
    moduleId: string
  }
  option: {
    id: string
    text: string
    nextQuestionId: string | null
  }
}

export interface StartFlowResponse {
  module: {
    id: string
    name: string
  }
  question: Question
}

export interface CurrentFlowResponse {
  question: Question
  state: FlowState
}

export interface DeepLinkResponse {
  redirected: boolean
  requestedQuestionId?: string
  message?: string
  question: Question
}

export interface AnswerResponse {
  completed: boolean
  moduleSwitched?: boolean
  message?: string
  question?: Question
}

export interface GoBackResponse {
  question: Question
  breadcrumbTrail: string[]
}

export interface ModulesResponse {
  modules: Module[]
}

export interface HistoryResponse {
  history: FlowHistoryEntry[]
}
