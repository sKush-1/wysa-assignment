import { Router, IRouter } from 'express'
import prisma from '../lib/prisma.js'

const router: IRouter = Router()

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate (create or find) a user by email
 *     description: |
 *       The **single entry point** for user provisioning. The frontend must call
 *       this endpoint once at login before making any other API requests.
 *
 *       If the user already exists, returns the existing record.
 *       If not, creates a new user and returns it.
 *
 *       This eliminates race conditions caused by multiple concurrent requests
 *       each independently trying to create the same user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *           example:
 *             email: "test@example.com"
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing or invalid email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required.' })
      return
    }

    const trimmed = email.trim().toLowerCase()

    const user = await prisma.user.upsert({
      where: { email: trimmed },
      update: {},
      create: { email: trimmed },
    })

    res.status(200).json({ user })
  } catch (err) {
    next(err)
  }
})

export default router
