import { User } from '@prisma/client'
import prisma from '../lib/prisma.js'
import { AppError } from '../middleware/error.middleware.js'

// ── Shared include shape ──────────────────────────────────────────────────────
const questionWithOptions = {
  include: {
    options: {
      select: {
        id: true,
        text: true,
        nextQuestionId: true,
      },
    },
  },
} as const

// ── 1. POST /api/flow/start ───────────────────────────────────────────────────
/**
 * Finds the entry-point question (no intra-module incoming routes),
 * then upserts the FlowState to reset / start the user in that module.
 */
export async function startFlow(user: User, moduleId: string) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } })
  if (!module) throw new AppError(404, `Module "${moduleId}" not found.`)

  // Defensive Guard: Check if user has already visited or answered questions in this module
  const visitedCount = await prisma.flowHistory.count({
    where: {
      userId: user.id,
      question: { moduleId },
    },
  })

  if (visitedCount > 0) {
    throw new AppError(
      403,
      'Forbidden: You have already completed or visited this module. The conversation state moves forward.',
    )
  }

  // Entry-point = question in this module that no other question in the SAME
  // module routes to (i.e. its incomingRoutes all come from other modules, or none at all).
  const firstQuestion = await prisma.question.findFirst({
    where: {
      moduleId,
      incomingRoutes: {
        none: {
          question: { moduleId },
        },
      },
    },
    ...questionWithOptions,
  })

  if (!firstQuestion) {
    throw new AppError(
      404,
      'No entry-point question found for this module. Ensure the module graph is configured correctly.',
    )
  }

  await prisma.flowState.upsert({
    where: { userId: user.id },
    update: {
      currentModuleId: moduleId,
      currentQuestionId: firstQuestion.id,
      breadcrumbTrail: [],
    },
    create: {
      userId: user.id,
      currentModuleId: moduleId,
      currentQuestionId: firstQuestion.id,
      breadcrumbTrail: [],
    },
  })

  return { module: { id: module.id, name: module.name }, question: firstQuestion }
}

// ── 2. GET /api/flow/current ──────────────────────────────────────────────────
export async function getCurrentQuestion(user: User) {
  const state = await prisma.flowState.findUnique({ where: { userId: user.id } })
  if (!state) throw new AppError(404, 'No active flow session. Call POST /api/flow/start first.')

  const question = await prisma.question.findUnique({
    where: { id: state.currentQuestionId },
    ...questionWithOptions,
  })
  if (!question) throw new AppError(404, 'Current question not found.')

  return { question, state }
}

// ── 3. GET /api/flow/questions/:questionId (Deep-Link) ────────────────────────
export async function deepLinkQuestion(user: User, questionId: string) {
  const state = await prisma.flowState.findUnique({ where: { userId: user.id } })
  if (!state) throw new AppError(404, 'No active flow session. Call POST /api/flow/start first.')

  // Strict match — if stale link, redirect to their actual position
  if (state.currentQuestionId !== questionId) {
    const actualQuestion = await prisma.question.findUnique({
      where: { id: state.currentQuestionId },
      ...questionWithOptions,
    })
    return {
      redirected: true,
      requestedQuestionId: questionId,
      message:
        'The requested question does not match your current position. Returning your actual current question.',
      question: actualQuestion,
    }
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    ...questionWithOptions,
  })

  return { redirected: false, question }
}

// ── 4. POST /api/flow/answer ──────────────────────────────────────────────────
export async function submitAnswer(user: User, questionId: string, optionId: string) {
  // Validate active state exists
  const state = await prisma.flowState.findUnique({ where: { userId: user.id } })
  if (!state) throw new AppError(404, 'No active flow session. Call POST /api/flow/start first.')

  // Guard: questionId must match current state (prevents stale submissions)
  if (state.currentQuestionId !== questionId) {
    throw new AppError(
      409,
      `State mismatch: your current question is "${state.currentQuestionId}", not "${questionId}". ` +
        `Fetch GET /api/flow/current to sync.`,
    )
  }

  // Validate option exists and belongs to this question
  const option = await prisma.option.findUnique({ where: { id: optionId } })
  if (!option) throw new AppError(404, `Option "${optionId}" not found.`)
  if (option.questionId !== questionId) {
    throw new AppError(400, `Option "${optionId}" does not belong to question "${questionId}".`)
  }

  // Fetch current question (needed for checkpoint logic)
  const currentQuestion = await prisma.question.findUnique({ where: { id: questionId } })
  if (!currentQuestion) throw new AppError(404, 'Current question not found.')

  // Immutable ledger entry
  await prisma.flowHistory.create({
    data: { userId: user.id, questionId, optionId },
  })

  // End-of-flow: option leads nowhere
  if (!option.nextQuestionId) {
    return { completed: true, message: 'You have reached the end of this flow. Well done!' }
  }

  const nextQuestion = await prisma.question.findUnique({
    where: { id: option.nextQuestionId },
    ...questionWithOptions,
  })
  if (!nextQuestion) {
    throw new AppError(
      404,
      'Next question not found — the flow graph may be misconfigured.',
    )
  }

  // Breadcrumb logic:
  //   isCheckpoint == true  → WIPE trail (user cannot go back past this point)
  //   isCheckpoint == false → APPEND current questionId to trail
  const currentTrail = state.breadcrumbTrail as string[]
  const newTrail: string[] = currentQuestion.isCheckpoint
    ? []
    : [...currentTrail, questionId]

  const moduleSwitched = nextQuestion.moduleId !== state.currentModuleId

  await prisma.flowState.update({
    where: { userId: user.id },
    data: {
      currentQuestionId: nextQuestion.id,
      currentModuleId: nextQuestion.moduleId, // handles module switching automatically
      breadcrumbTrail: newTrail,
    },
  })

  return {
    completed: false,
    moduleSwitched,
    question: nextQuestion,
  }
}

// ── 5. POST /api/flow/back (Bonus) ────────────────────────────────────────────
export async function goBack(user: User) {
  const state = await prisma.flowState.findUnique({ where: { userId: user.id } })
  if (!state) throw new AppError(404, 'No active flow session. Call POST /api/flow/start first.')

  const trail = state.breadcrumbTrail as string[]

  if (trail.length === 0) {
    throw new AppError(
      400,
      'Cannot go back further in this context: ' +
        'you are at the start of the flow, have just passed a checkpoint, or have switched modules.',
    )
  }

  const previousQuestionId = trail[trail.length - 1]
  const newTrail = trail.slice(0, -1)

  await prisma.flowState.update({
    where: { userId: user.id },
    data: {
      currentQuestionId: previousQuestionId,
      breadcrumbTrail: newTrail,
    },
  })

  const question = await prisma.question.findUnique({
    where: { id: previousQuestionId },
    ...questionWithOptions,
  })

  return { question, breadcrumbTrail: newTrail }
}

// ── 6. GET /api/flow/modules ──────────────────────────────────────────────────
export async function listModules(user?: User) {
  const modules = await prisma.module.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: { questions: true },
      },
    },
  })

  let visitedModuleIds = new Set<string>()
  if (user) {
    const visited = await prisma.flowHistory.findMany({
      where: { userId: user.id },
      select: { question: { select: { moduleId: true } } },
    })
    visitedModuleIds = new Set(visited.map((v) => v.question.moduleId))
  }

  const enrichedModules = modules.map((m) => ({
    ...m,
    visited: visitedModuleIds.has(m.id),
  }))

  return { modules: enrichedModules }
}
