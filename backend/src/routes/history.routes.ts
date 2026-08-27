import { Router, IRouter } from 'express'
import { getUserHistory } from '../controllers/history.controller.js'

const router: IRouter = Router()

/**
 * @swagger
 * /api/history:
 *   get:
 *     tags: [History]
 *     summary: Get the user's complete conversation history
 *     description: |
 *       Returns the full **immutable ledger** of every question answered and option
 *       selected by this user, ordered chronologically (oldest first).
 *
 *       This is the `FlowHistory` table — it is **append-only** and never mutated
 *       by actions like "go back".
 *     responses:
 *       200:
 *         description: Full history array (may be empty if user has never answered)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HistoryEntry'
 *       401:
 *         description: Missing x-user-email header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getUserHistory) // GET /api/history

export default router
