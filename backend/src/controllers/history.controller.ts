import { Request, Response, NextFunction } from 'express'
import * as historyService from '../services/history.service.js'

export async function getUserHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const history = await historyService.getUserHistory(req.user!)
    res.status(200).json({ history })
  } catch (err) {
    next(err)
  }
}
