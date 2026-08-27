import { Request, Response, NextFunction } from 'express'
import { startFlowSchema, answerSchema } from '../validators/flow.validator.js'
import * as flowService from '../services/flow.service.js'

export async function startFlow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = startFlowSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      return
    }
    const result = await flowService.startFlow(req.user!, parsed.data.moduleId)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function getCurrentQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await flowService.getCurrentQuestion(req.user!)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function deepLinkQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const questionId = req.params['questionId'] as string
    const result = await flowService.deepLinkQuestion(req.user!, questionId)
    // 307 signals to the client that its link is stale
    res.status(result.redirected ? 307 : 200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = answerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      return
    }
    const result = await flowService.submitAnswer(
      req.user!,
      parsed.data.questionId,
      parsed.data.optionId,
    )
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function goBack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await flowService.goBack(req.user!)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function listModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await flowService.listModules(req.user)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
