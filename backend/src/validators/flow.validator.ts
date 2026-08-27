import { z } from 'zod'

export const startFlowSchema = z.object({
  moduleId: z.string().uuid('moduleId must be a valid UUID'),
})

export const answerSchema = z.object({
  questionId: z.string().uuid('questionId must be a valid UUID'),
  optionId: z.string().uuid('optionId must be a valid UUID'),
})

export type StartFlowInput = z.infer<typeof startFlowSchema>
export type AnswerInput = z.infer<typeof answerSchema>
