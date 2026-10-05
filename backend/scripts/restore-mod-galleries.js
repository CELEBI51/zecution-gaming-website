import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { UPLOAD_ROOT, ensureUploadDirs } from '../src/services/storage.service.js'

const MAPPINGS = [
  // 1. Fiat Linea 2009 Bedelinea (3840x2160)
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944131/zecution/mods/pzgy0n8iupbgy1nyklmz.jpg',
    filename: 'd70bb884-a4c6-44fd-9a0d-1ea4a4966e62.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944132/zecution/mods/kxes5jsgmopdaktszv2t.jpg',
    filename: '511a866d-e299-4225-a6b2-515d1d0609d1.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944133/zecution/mods/t3hai4lwejjrvjjbotm3.jpg',
    filename: 'b93354d3-9e04-4ea1-91d7-31ce03394960.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944133/zecution/mods/da61jt8nbbyucqgs55ry.jpg',
    filename: '0770c053-2241-42a8-a179-ea8cd7cc3dcb.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944134/zecution/mods/x7fyx0erxfnusdydn4z8.jpg',
    filename: '3327900f-a415-4fa3-8593-4a6b912e8b4e.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944135/zecution/mods/edmsdxj4obrisbhbt92n.jpg',
    filename: 'e720396c-b529-4ba6-b921-8e268dbe4c17.webp'
  },

  // 2. Honda S2000 AP2 V2 (1920x1080)
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944122/zecution/mods/vqkm1ipxomj4qewrrbwp.jpg',
    filename: '465a2550-ea9f-4ea4-b01c-3cdd9d929609.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944123/zecution/mods/fpaxrm5ieyxk1fliklgz.jpg',
    filename: 'f4f3b32e-915a-4ee6-bdab-733487f48485.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944124/zecution/mods/fz7x2oswbg58xptutwxm.jpg',
    filename: 'b61d239f-8c0f-4cc8-a74f-26dc34c748c1.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944125/zecution/mods/vydhmi3mesgxflt1eklm.jpg',
    filename: '0bf13548-4c44-446b-9961-60b0cfea677f.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944125/zecution/mods/vgdcpetmwwbo59y3dtvt.jpg',
    filename: 'd25b6519-9b16-415f-92dc-b9fcd25cdc3d.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944127/zecution/mods/ix6dijo6eh0koolcueci.jpg',
    filename: '41f9d498-f62a-46eb-8b7d-5d55961a79ef.webp'
  },

  // 3. TOFAŞ DoğanSlx (Ankara İşi) (1920x1080)
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944136/zecution/mods/plrql2kdm9db52mp2rwd.jpg',
    filename: '15b58236-0ec6-4f25-ad5d-17280fae0e4f.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944137/zecution/mods/u5xd07tojjmuok1zqsq5.jpg',
    filename: 'f64a39c1-d398-43d7-a74a-467cf53d9ebc.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944137/zecution/mods/cc4n8c8xao9ghwmiekal.jpg',
    filename: '74e02dd3-867d-4840-984d-3d233a56d336.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944138/zecution/mods/bczbgcibkosouotghhk8.jpg',
    filename: '707933ee-9f73-40e7-ab2d-097e65fbed4c.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944139/zecution/mods/xmol4xda8qwvy4a5vq7f.jpg',
    filename: '28c51b3e-9c7c-4ef3-8ed5-f0b73f5b9c68.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944140/zecution/mods/kgo7i7fogp1wwbwreatb.jpg',
    filename: 'b8748cf5-2623-4c2a-a9dc-f328657bf8f1.webp'
  },

  // 4. BMW E36 320i Convertible 1997 (3840x2160)
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944144/zecution/mods/rx4jv1ieh6nndoons5il.jpg',
    filename: '1a44cf64-bec5-4009-ab11-bbba773cc410.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944146/zecution/mods/obruy4eamjrdsprnfa0r.jpg',
    filename: 'cd6b47d5-dd7c-4fcc-889a-e0f104acf9b4.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944147/zecution/mods/ywnmqarb9jowsyzez6g9.jpg',
    filename: '849bfa7a-8829-4bbb-a97c-b7c305c188e7.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944147/zecution/mods/hbh29pjdd5tjvqsiodc8.jpg',
    filename: '6029b92d-b406-4f7d-a87e-d4bc77a3eb29.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944148/zecution/mods/wpzebehqj161vsxitvzl.jpg',
    filename: 'de7ed004-087b-4b2d-ab89-d78a709a57d0.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790944149/zecution/mods/sftufyxkpic2ayzmgimv.jpg',
    filename: '20925b3e-38ca-48b8-93d5-fec20263b193.webp'
  },

  // 5. CİNGAN GASA FORD TRANSİT MİNİBÜS (3840x2160 / 3648x1922)
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105352/zecution/klrahujy39imem5d6idi.jpg',
    filename: '7c2193bb-6039-42db-af65-a65cbfa6c459.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105352/zecution/wicfql48yg7mmegkayxp.jpg',
    filename: '1a658188-33c9-4809-8a64-ee4b0937aaae.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105353/zecution/nr0dlngqezr7kjakbods.jpg',
    filename: '8bd3479a-f2e6-4c0d-9f39-462395e977cb.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105355/zecution/j8jltdfn8g9tjt1v7sgy.jpg',
    filename: 'd9370607-f99f-4cdf-b322-3331d62d598a.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105355/zecution/nwtkbgsow4bsxp2oo84j.jpg',
    filename: 'a5720510-49bc-4f7c-9961-58ac1aa38f5e.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105356/zecution/cpwmiezor9sv6weo3tpn.jpg',
    filename: 'fb522225-282e-45fa-b21a-c6f19e1a9a92.webp'
  }
]

async function run() {
  console.log('🚀 Cloudinary mod galerisi görselleri indiriliyor ve WebP formatında üretiliyor...')
  await ensureUploadDirs()

  let count = 0
  for (const item of MAPPINGS) {
    try {
      console.log(`[${++count}/${MAPPINGS.length}] İndiriliyor: ${item.filename} (${item.cldUrl})`)
      const res = await fetch(item.cldUrl)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const buffer = Buffer.from(await res.arrayBuffer())

      const originalDiskPath = path.join(UPLOAD_ROOT, 'original', item.filename)
      const largeDiskPath = path.join(UPLOAD_ROOT, 'large', item.filename)
      const thumbDiskPath = path.join(UPLOAD_ROOT, 'thumbnail', item.filename)

      // 1. Original (q95)
      await sharp(buffer)
        .rotate()
        .resize({ width: 3840, withoutEnlargement: true })
        .webp({ quality: 95 })
        .toFile(originalDiskPath)

      // 2. Large (2560px, q90)
      await sharp(buffer)
        .rotate()
        .resize({ width: 2560, withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(largeDiskPath)

      // 3. Thumbnail (800px, q85)
      await sharp(buffer)
        .rotate()
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(thumbDiskPath)

      console.log(`  ✓ Başarıyla üretildi: ${item.filename}`)
    } catch (err) {
      console.error(`  ❌ Hata (${item.filename}):`, err.message)
    }
  }

  console.log('\n🎉 Tamamlandı!')
}

run().catch(console.error)
