import { Router } from 'express'
import {
  getPublicCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.controller.js'
import {
  listCategoriesQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from './categories.validation.js'
import { validate } from '../../middleware/validate.middleware.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'

// Herkese açık rotalar
const publicRouter = Router()
publicRouter.get('/', validate({ query: listCategoriesQuerySchema }), getPublicCategories)

// Admin rotaları
const adminRouter = Router()
adminRouter.use(requireAdmin)
adminRouter.get('/', validate({ query: listCategoriesQuerySchema }), getAdminCategories)
adminRouter.post('/', validate({ body: createCategorySchema }), createCategory)
adminRouter.patch('/:id', validate({ body: updateCategorySchema }), updateCategory)
adminRouter.delete('/:id', deleteCategory)

export const categoriesPublicRoutes = publicRouter
export const categoriesAdminRoutes = adminRouter
