import * as categoriesService from './categories.service.js'

export async function getPublicCategories(req, res, next) {
  try {
    const categories = await categoriesService.listCategories(req.query, true)
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}

export async function getAdminCategories(req, res, next) {
  try {
    const categories = await categoriesService.listCategories(req.query, false)
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await categoriesService.createCategory(req.body)
    res.status(201).json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await categoriesService.updateCategory(req.params.id, req.body)
    res.json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
}

export async function deleteCategory(req, res, next) {
  try {
    await categoriesService.deleteCategory(req.params.id)
    res.json({ success: true, message: 'Kategori başarıyla silindi' })
  } catch (error) {
    next(error)
  }
}
