import { Router } from 'express'
import { getGames, getGame } from './games.controller.js'

const router = Router()

router.get('/', getGames)
router.get('/:slug', getGame)

export const gamesRoutes = router
