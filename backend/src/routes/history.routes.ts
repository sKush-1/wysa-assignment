import { Router, IRouter } from 'express'
import { getUserHistory } from '../controllers/history.controller.js'

const router: IRouter = Router()

router.get('/', getUserHistory) // GET /api/history

export default router
