import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const targetCovers = [
  {
    name: 'Honda S2000 AP2 V2',
    src: 'C:/Users/ahmet/Pictures/site_görsel/s2000v2/jpg/kapak.jpg',
    uuid: 'c7518bca-1de9-4592-9505-b4d5bf9a1a3f.webp'
  },
  {
    name: 'TOFAŞ DoğanSlx (Ankara İşi)',
    src: 'C:/Users/ahmet/Pictures/site_görsel/ankara işi tofaş yeni/tofaş.jpg',
    uuid: '68347d7f-c2b5-4468-86d5-3478c0d1df6c.webp'
  },
  {
    name: 'Tofaş DoğanS atmosferik (Adana işi)',
    src: 'C:/Users/ahmet/Pictures/site_görsel/doğans/jpg/tofaş.jpg',
    uuid: '8ce8bbe0-b25f-439f-889f-6befbdaa5f97.webp'
  },
  {
    name: 'CİNGAN GASA FORD TRANSİT MİNİBÜS',
    src: 'C:/Users/ahmet/Pictures/site_görsel/cingenkasatransit_van/ford.jpg',
    uuid: '2015b37c-0270-470e-853d-90c861cf2547.webp'
  },
  {
    name: 'Fiat Linea eski kasa 2009 Bedelinea',
    src: 'C:/Users/ahmet/Pictures/site_görsel/Bedelinea/fiat.jpg',
    uuid: '2061a98e-96a9-495e-b580-53af4d5b6b54.webp'
  },
  {
    name: 'Fiat Linea 2014 1.3 multijet',
    src: 'C:/Users/ahmet/Pictures/site_görsel/linea/jpg/fiat.jpg',
    uuid: '8340eb5f-4e0f-402a-b228-f69fea99b800.webp'
  },
  {
    name: 'BMW E36 320i Convertible 1997',
    src: 'C:/Users/ahmet/Pictures/site_görsel/e36/jpg/Screenshot_zecution_gaming_bmw_e36_convertible_at_previews_5-6-125-14-20-37.jpg',
    uuid: '85a2a4fd-8795-4992-a3f4-4422d9137596.webp'
  },
  {
    name: 'Real Monaco',
    src: 'C:/Users/ahmet/Pictures/site_görsel/haritagorsel/CML GAMING BMW G30 550D X-Drive_23_36_38.jpg',
    uuid: 'cd3c9779-7de7-498c-b60b-b039e15ee795.webp'
  }
]

async function generateAll() {
  for (const item of targetCovers) {
    if (!fs.existsSync(item.src)) {
      console.error(`ERROR: Source does not exist: ${item.src}`)
      continue
    }
    const buf = fs.readFileSync(item.src)
    console.log(`Processing ${item.name} at 100% original full scale...`)

    // 1. Original (Direct unscaled from source, max 3840px without enlargement)
    await sharp(buf)
      .rotate()
      .resize({ width: 3840, withoutEnlargement: true })
      .webp({ quality: 95 })
      .toFile(path.join('backend/uploads/original', item.uuid))

    // 2. Large (2560px WebP q90)
    await sharp(buf)
      .rotate()
      .resize({ width: 2560, withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(path.join('backend/uploads/large', item.uuid))

    // 3. Thumbnail (800px WebP q85)
    await sharp(buf)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join('backend/uploads/thumbnail', item.uuid))

    console.log(`  ✓ Successfully wrote original, large, thumb for ${item.uuid}`)
  }
  console.log('ALL 8 COVERS SUCCESSFULLY GENERATED AT 100% ORIGINAL SCALE!')
}

generateAll()
