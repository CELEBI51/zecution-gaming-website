import * as gamesService from './games.service.js'

export async function getGames(_req, res, next) {
  try {
    const games = await gamesService.listGames()
    res.json({ success: true, data: games })
  } catch (error) {
    next(error)
  }
}

export async function getGame(req, res, next) {
  try {
    const game = await gamesService.getGameBySlug(req.params.slug)
    res.json({ success: true, data: game })
  } catch (error) {
    next(error)
  }
}
