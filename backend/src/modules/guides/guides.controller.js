import * as guidesService from './guides.service.js'
import { processAndSaveImage } from '../../services/image.service.js'
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} from '../../services/cloudinary.service.js'
import { BadRequestError } from '../../utils/api-error.js'

export async function getGuides(req, res, next) {
  try {
    const guides = await guidesService.getAllGuides({
      isAdmin: false,
      search: req.query.search,
      category: req.query.category,
    })
    res.json({ guides })
  } catch (err) {
    next(err)
  }
}

export async function getGuide(req, res, next) {
  try {
    const guide = await guidesService.getGuideBySlug(req.params.slug, { isAdmin: false })
    res.json({ guide })
  } catch (err) {
    next(err)
  }
}

export async function adminGetGuides(req, res, next) {
  try {
    const guides = await guidesService.getAllGuides({
      isAdmin: true,
      search: req.query.search,
      category: req.query.category,
    })
    res.json({ guides })
  } catch (err) {
    next(err)
  }
}

export async function adminGetGuideById(req, res, next) {
  try {
    const guide = await guidesService.getGuideBySlug(req.params.id, { isAdmin: true })
    res.json({ guide })
  } catch (err) {
    next(err)
  }
}

export async function adminCreateGuide(req, res, next) {
  try {
    const guide = await guidesService.createGuide(req.body)
    res.status(201).json({ message: 'Rehber başarıyla oluşturuldu.', guide })
  } catch (err) {
    next(err)
  }
}

export async function adminUpdateGuide(req, res, next) {
  try {
    const guide = await guidesService.updateGuide(req.params.id, req.body)
    res.json({ message: 'Rehber başarıyla güncellendi.', guide })
  } catch (err) {
    next(err)
  }
}

export async function adminDeleteGuide(req, res, next) {
  try {
    const result = await guidesService.deleteGuide(req.params.id)
    res.json({ message: 'Rehber başarıyla silindi.', ...result })
  } catch (err) {
    next(err)
  }
}

export async function adminUploadGuideImages(req, res, next) {
  try {
    const files = req.files || (req.file ? [req.file] : [])
    if (!files || files.length === 0) {
      throw new BadRequestError('Yüklenecek görsel dosyası seçilmedi.')
    }

    const useCloudinary = isCloudinaryConfigured()
    const uploadedImages = []

    for (const file of files) {
      if (useCloudinary) {
        const cloudResult = await uploadBufferToCloudinary(file.buffer, { resourceType: 'image' })
        uploadedImages.push({
          url: cloudResult.filePath,
          thumbnail: cloudResult.thumbnailPath,
          width: cloudResult.width,
          height: cloudResult.height,
        })
      } else {
        const imgResult = await processAndSaveImage(file.buffer)
        uploadedImages.push({
          url: imgResult.filePath,
          thumbnail: imgResult.thumbnailPath,
          width: imgResult.width,
          height: imgResult.height,
        })
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} adet görsel başarıyla sunucuya yüklendi.`,
      images: uploadedImages,
      urls: uploadedImages.map((img) => img.url),
    })
  } catch (err) {
    next(err)
  }
}
