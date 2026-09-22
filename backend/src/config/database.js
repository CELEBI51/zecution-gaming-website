import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/index.js'
import { env } from './env.js'

const logOptions =
  env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
})

export const prisma = new PrismaClient({
  adapter,
  log: logOptions,
})

export async function connectDatabase() {
  await prisma.$connect()
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
}
