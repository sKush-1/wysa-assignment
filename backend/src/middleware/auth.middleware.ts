import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma.js'

/**
 * Reads the `x-user-email` header and upserts the user in the database,
 * then attaches them to `req.user` for all downstream handlers.
 * Rejects with 401 if header is missing or invalid.
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

/**
 * Optional authentication middleware.
 * If `x-user-email` is present, attaches the user to `req.user`.
 * If not present, proceeds seamlessly with `req.user = undefined`.
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const email = req.headers['x-user-email']

  if (email && typeof email === 'string') {
    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
      })
      req.user = user
    } catch {
      // Ignore user upsert error on optional auth
    }
  }

  next()
}
