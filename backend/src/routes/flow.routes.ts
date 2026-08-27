import { Router, IRouter } from 'express'
import {
  authMiddleware,
  optionalAuthMiddleware,
} from '../middleware/auth.middleware.js'
import {
  startFlow,
  getCurrentQuestion,
  deepLinkQuestion,
  submitAnswer,
  goBack,
  listModules,
} from '../controllers/flow.controller.js'

const router: IRouter = Router()

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/flow/start:
 *   post:
 *     tags: [Flow]
 *     summary: Start or reset a module for the user
 *     description: |
 *       Initialises (or resets) the user's active flow session for the given module.
 *       Finds the **entry-point question** (the question in the module that no other
 *       question within the same module routes to), then upserts a `FlowState` record
 *       with an empty `breadcrumbTrail`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [moduleId]
 *             properties:
 *               moduleId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the module to start
 *           example:
 *             moduleId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 *     responses:
 *       200:
 *         description: Flow started — returns the first question and its options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module:
 *                   $ref: '#/components/schemas/Module'
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation error (invalid UUID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Missing x-user-email header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Module not found, or module has no entry-point question
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/start', authMiddleware, startFlow)

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/flow/current:
 *   get:
 *     tags: [Flow]
 *     summary: Get the user's current question
 *     description: |
 *       The standard way for a frontend to ask *"Where is this user right now?"*
 *       Looks up the user's `FlowState` and returns the `currentQuestion` with its options.
 *     responses:
 *       200:
 *         description: Current question with options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *                 state:
 *                   $ref: '#/components/schemas/FlowState'
 *       401:
 *         description: Missing x-user-email header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No active flow session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No active flow session. Call POST /api/flow/start first."
 */
router.get('/current', authMiddleware, getCurrentQuestion)

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/flow/questions/{questionId}:
 *   get:
 *     tags: [Flow]
 *     summary: Deep-link handler — resolve a stale question link
 *     description: |
 *       Handles the scenario where a user clicks a push notification saying
 *       *"Resume at Question 5"* (a potentially stale deep-link).
 *
 *       **Logic:**
 *       - If `questionId` **matches** `FlowState.currentQuestionId` → `200` with the question.
 *       - If `questionId` **doesn't match** → `307` with the user's **actual** current question
 *         and a `redirected: true` flag, so the client knows the link was stale.
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The question ID from the deep-link
 *     responses:
 *       200:
 *         description: Requested question matches current state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirected:
 *                   type: boolean
 *                   example: false
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       307:
 *         description: Stale link — redirected to actual current question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirected:
 *                   type: boolean
 *                   example: true
 *                 requestedQuestionId:
 *                   type: string
 *                   format: uuid
 *                 message:
 *                   type: string
 *                   example: "The requested question does not match your current position. Returning your actual current question."
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       401:
 *         description: Missing x-user-email header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No active flow session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/questions/:questionId', authMiddleware, deepLinkQuestion)

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/flow/answer:
 *   post:
 *     tags: [Flow]
 *     summary: Submit an answer and advance the flow
 *     description: |
 *       The **engine** of the application. Processes the user's answer and routes them
 *       to the next node in the graph.
 *
 *       **Validation chain:**
 *       1. Checks an active `FlowState` exists.
 *       2. Guards that `questionId` matches `FlowState.currentQuestionId` (prevents stale submissions → `409`).
 *       3. Guards that `optionId` belongs to `questionId` (prevents tampered input → `400`).
 *
 *       **State update:**
 *       - Writes an **immutable** row to `FlowHistory`.
 *       - If the answered question `isCheckpoint = true` → wipes `breadcrumbTrail` to `[]`.
 *       - Otherwise → appends the answered `questionId` to `breadcrumbTrail`.
 *       - Updates `currentQuestionId` (and `currentModuleId` if the next question is in a different module).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId, optionId]
 *             properties:
 *               questionId:
 *                 type: string
 *                 format: uuid
 *                 description: Must match FlowState.currentQuestionId
 *               optionId:
 *                 type: string
 *                 format: uuid
 *                 description: Must belong to the above questionId
 *           example:
 *             questionId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 *             optionId:   "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
 *     responses:
 *       200:
 *         description: Answer accepted — returns next question, or completion signal
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Flow still in progress
 *                   properties:
 *                     completed:
 *                       type: boolean
 *                       example: false
 *                     moduleSwitched:
 *                       type: boolean
 *                       description: true when the next question is in a different module
 *                     question:
 *                       $ref: '#/components/schemas/Question'
 *                 - type: object
 *                   description: Flow complete (option.nextQuestionId was null)
 *                   properties:
 *                     completed:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "You have reached the end of this flow. Well done!"
 *       400:
 *         description: Validation error or optionId does not belong to questionId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Missing x-user-email header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No active session, question not found, or option not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: State mismatch — questionId does not match current state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "State mismatch: your current question is \"<id>\", not \"<id>\". Fetch GET /api/flow/current to sync."
 */
router.post('/answer', authMiddleware, submitAnswer)

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/flow/back:
 *   post:
 *     tags: [Flow]
 *     summary: "(Bonus) Go back to the previous question"
 *     description: |
 *       Reverts the user's state one step backward using the `breadcrumbTrail`.
 *
 *       **Rules:**
 *       - If `breadcrumbTrail` is **empty** (start of flow, just passed a checkpoint, or module was switched) → `400` error.
 *       - Otherwise: pops the last ID off the trail, sets it as `currentQuestionId`, and saves the shortened trail.
 *       - **Never** deletes anything from `FlowHistory` — the ledger is immutable.
 *     responses:
 *       200:
 *         description: Moved back — returns the previous question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *                 breadcrumbTrail:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   description: Updated (shortened) trail after popping
 *       400:
 *         description: Cannot go back — trail is empty (start, checkpoint, or module switch)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Cannot go back further in this context: you are at the start of the flow, have just passed a checkpoint, or have switched modules."
 *       401:
 *         description: Missing x-user-email header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No active flow session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/back', authMiddleware, goBack)
router.get('/modules', optionalAuthMiddleware, listModules)

export default router
