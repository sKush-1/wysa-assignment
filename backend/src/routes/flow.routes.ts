import { Router, IRouter } from 'express'
import {
  startFlow,
  getCurrentQuestion,
  deepLinkQuestion,
  submitAnswer,
  goBack,
} from '../controllers/flow.controller.js'

const router: IRouter = Router()

router.post('/start', startFlow)                        // POST /api/flow/start
router.get('/current', getCurrentQuestion)              // GET  /api/flow/current
router.get('/questions/:questionId', deepLinkQuestion)  // GET  /api/flow/questions/:questionId
router.post('/answer', submitAnswer)                    // POST /api/flow/answer
router.post('/back', goBack)                            // POST /api/flow/back (bonus)

export default router
