import { apiClient } from './client'
import type {
  StartFlowResponse,
  CurrentFlowResponse,
  DeepLinkResponse,
  AnswerResponse,
  GoBackResponse,
  ModulesResponse,
  HistoryResponse,
} from '../types'

/**
 * API service covering all conversation flow endpoints.
 */
export const flowApi = {
  /**
   * Fetches available modules for selection.
   */
  async getModules(): Promise<ModulesResponse> {
    const res = await apiClient.get<ModulesResponse>('/flow/modules')
    return res.data
  },

  /**
   * POST /api/flow/start
   * Initializes or resets a user's flow in a specific module.
   */
  async startFlow(moduleId: string): Promise<StartFlowResponse> {
    const res = await apiClient.post<StartFlowResponse>('/flow/start', { moduleId })
    return res.data
  },

  /**
   * GET /api/flow/current
   * Fetches the user's current valid question based on their active state.
   */
  async getCurrent(): Promise<CurrentFlowResponse> {
    const res = await apiClient.get<CurrentFlowResponse>('/flow/current')
    return res.data
  },

  /**
   * GET /api/flow/questions/:questionId
   * Deep link handler. Resolves old/stale link, returns 200 or 307 with redirected flag.
   */
  async getQuestionById(questionId: string): Promise<DeepLinkResponse> {
    const res = await apiClient.get<DeepLinkResponse>(`/flow/questions/${questionId}`)
    return res.data
  },

  /**
   * POST /api/flow/answer
   * Submits an answer, updates history, and returns next question (or completed).
   */
  async submitAnswer(questionId: string, optionId: string): Promise<AnswerResponse> {
    const res = await apiClient.post<AnswerResponse>('/flow/answer', {
      questionId,
      optionId,
    })
    return res.data
  },

  /**
   * POST /api/flow/back
   * Moves the user back to the previous question (fails with 400 if empty trail/checkpoint).
   */
  async goBack(): Promise<GoBackResponse> {
    const res = await apiClient.post<GoBackResponse>('/flow/back')
    return res.data
  },

  /**
   * GET /api/history
   * Returns the user's complete conversation ledger.
   */
  async getHistory(): Promise<HistoryResponse> {
    const res = await apiClient.get<HistoryResponse>('/history')
    return res.data
  },
}
