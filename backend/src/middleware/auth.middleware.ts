import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma.js'

/**
 * Reads the `x-user-email` header and looks up the user in the database.
 * The user must already exist (created via POST /api/auth/login).
 * Rejects with 401 if header is missing, invalid, or user not found.
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
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(401).json({ error: 'User not found. Please log in first via POST /api/auth/login.' })
      return
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Optional authentication middleware.
 * If `x-user-email` is present and user exists, attaches to `req.user`.
 * If not present or user not found, proceeds with `req.user = undefined`.
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const email = req.headers['x-user-email']

  if (email && typeof email === 'string') {
    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) req.user = user
    } catch {
      // Ignore — optional auth
    }
  }

  next()
}

