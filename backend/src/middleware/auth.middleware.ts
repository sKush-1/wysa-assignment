import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma.js'

/**
 * Reads the `x-user-email` header and upserts the user in the database,
 * then attaches them to `req.user` for all downstream handlers.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const email = req.headers['x-user-email']

  if (!email || typeof email !== 'string') {
    res.status(401).json({ error: 'Missing or invalid x-user-email header' })
    return
  }

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    })
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}
