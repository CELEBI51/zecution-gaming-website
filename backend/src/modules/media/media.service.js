import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '../../config/database.js'
import { processAndSaveImage } from '../../services/image.service.js'
import { deleteFileSafe, UPLOAD_ROOT, ensureUploadDirs } from '../../services/storage.service.js'
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from '../../services/cloudinary.service.js'
import { BadRequestError, NotFoundError } from '../../utils/api-error.js'

export async function uploadContentMedia(contentId, files) {
  if (!files || files.length === 0) {
    throw new BadRequestError('Yüklenecek dosya seçilmedi')
  }

  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { id: true },
  })

  if (!content) {
    throw new NotFoundError('İçerik bulunamadı')
  }

  // Mevcut medya sayısını ve kapak varlığını kontrol et
  const [existingCount, hasCover] = await Promise.all([
    prisma.contentMedia.count({ where: { contentId } }),
    prisma.contentMedia.count({ where: { contentId, isCover: true } }),
  ])

  const useCloudinary = isCloudinaryConfigured()
  const uploadedRecords = []

  for (const [index, file] of files.entries()) {
    const isVideo = file.mimetype.startsWith('video/')
    let filePath
    let thumbnailPath
    let width = null
    let height = null
    let mediaType = isVideo ? 'VIDEO' : 'IMAGE'

    if (useCloudinary) {
      const result = await uploadBufferToCloudinary(file.buffer, {
        resourceType: isVideo ? 'video' : 'image',
      })
      filePath = result.filePath
      thumbnailPath = result.thumbnailPath
      width = result.width
      height = result.height
      mediaType = result.mediaType
    } else {
      // Yerel yükleme fallback
      if (isVideo) {
        await ensureUploadDirs()
        const ext = path.extname(file.originalname) || '.mp4'
        const filename = `${crypto.randomUUID()}${ext}`
        const diskPath = path.join(UPLOAD_ROOT, 'videos', filename)
        await fs.writeFile(diskPath, file.buffer)
        filePath = `/uploads/videos/${filename}`
        thumbnailPath = null
      } else {
        const imageResult = await processAndSaveImage(file.buffer)
        filePath = imageResult.filePath
        thumbnailPath = imageResult.thumbnailPath
        width = imageResult.width
        height = imageResult.height
      }
    }

    const isCover = hasCover === 0 && index === 0 && !isVideo
    const sortOrder = existingCount + index + 1

    const media = await prisma.contentMedia.create({
      data: {
        contentId,
        mediaType,
        filePath,
        thumbnailPath,
        width,
        height,
        sortOrder,
        isCover,
        altText: file.originalname ? file.originalname.split('.')[0] : null,
      },
    })

    uploadedRecords.push(media)
  }

  return uploadedRecords
}

export async function reorderContentMedia(contentId, mediaIds) {
  const updates = mediaIds.map((id, index) =>
    prisma.contentMedia.updateMany({
      where: { id, contentId },
      data: { sortOrder: index + 1 },
    })
  )

  await prisma.$transaction(updates)

  return prisma.contentMedia.findMany({
    where: { contentId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function setMediaCover(mediaId) {
  const media = await prisma.contentMedia.findUnique({
    where: { id: mediaId },
    select: { id: true, contentId: true },
  })

  if (!media) {
    throw new NotFoundError('Görsel bulunamadı')
  }

  await prisma.$transaction([
    prisma.contentMedia.updateMany({
      where: { contentId: media.contentId },
      data: { isCover: false },
    }),
    prisma.contentMedia.update({
      where: { id: mediaId },
      data: { isCover: true },
    }),
  ])

  return prisma.contentMedia.findMany({
    where: { contentId: media.contentId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function deleteMedia(mediaId) {
  const media = await prisma.contentMedia.findUnique({
    where: { id: mediaId },
  })

  if (!media) {
    throw new NotFoundError('Görsel bulunamadı')
  }

  // 1. Veritabanından sil
  await prisma.contentMedia.delete({
    where: { id: mediaId },
  })

  // 2. Dosyaları sil (Cloudinary veya Yerel)
  if (media.filePath.startsWith('http://') || media.filePath.startsWith('https://')) {
    await deleteFromCloudinary(media.filePath, media.mediaType === 'VIDEO' ? 'video' : 'image')
  } else {
    await Promise.all([
      deleteFileSafe(media.filePath),
      deleteFileSafe(media.thumbnailPath),
      deleteFileSafe(media.filePath.replace('/large/', '/original/')),
    ])
  }

  // Eğer silinen görsel kapaksa ve başka görseller varsa, ilk görseli kapak yap
  if (media.isCover) {
    const nextFirst = await prisma.contentMedia.findFirst({
      where: { contentId: media.contentId },
      orderBy: { sortOrder: 'asc' },
    })
    if (nextFirst) {
      await prisma.contentMedia.update({
        where: { id: nextFirst.id },
        data: { isCover: true },
      })
    }
  }

  return { success: true }
}
