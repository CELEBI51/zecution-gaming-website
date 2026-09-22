import 'dotenv/config'
import { prisma } from '../src/config/database.js'
import { hashPassword } from '../src/services/auth.service.js'

async function main() {
  const email = (process.env.ADMIN_EMAIL || process.argv[2] || '').toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || ''
  const name = (process.env.ADMIN_NAME || process.argv[4] || 'Zecution Admin').trim()

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL ve ADMIN_PASSWORD zorunludur.')
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Geçerli bir admin e-posta adresi girilmelidir.')
  }

  if (password.length < 12) {
    throw new Error('Admin parolası en az 12 karakter olmalıdır.')
  }

  const passwordHash = await hashPassword(password)
  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('Admin hesabı başarıyla kaydedildi:')
  console.log(`ID: ${admin.id}`)
  console.log(`Ad: ${admin.name}`)
  console.log(`E-posta: ${admin.email}`)
  console.log(`Rol: ${admin.role}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Admin oluşturulurken hata:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  })
