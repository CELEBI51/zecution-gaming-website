import { app } from './app.js'
import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { ensureUploadDirs } from './services/storage.service.js'

async function bootstrap() {
  try {
    await ensureUploadDirs()
    console.log('📁 Yükleme dizinleri hazırlandı.')

    try {
      await connectDatabase()
      console.log('🐘 PostgreSQL veritabanına bağlanıldı.')
    } catch (dbError) {
      console.warn(
        '⚠️ Veritabanı bağlantısı kurulamadı (DATABASE_URL kontrol ediniz):',
        dbError.message
      )
    }

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Zecution Gaming API çalışıyor: http://localhost:${env.PORT}`)
      console.log(`🛡️ Ortam: ${env.NODE_ENV}, İzin Verilen Origin: ${env.FRONTEND_ORIGIN}`)
    })

    const shutdown = async (signal) => {
      console.log(`\n🛑 ${signal} sinyali alındı. Sunucu kapatılıyor...`)
      server.close(async () => {
        await disconnectDatabase()
        console.log('🔌 Veritabanı bağlantısı kapatıldı. Çıkış yapılıyor.')
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('uncaughtException', (err) => {
      console.error('⚠️ Yakalanmamış İstisna:', err)
    })
    process.on('unhandledRejection', (reason) => {
      console.error('⚠️ İşlenmemiş Promise Reddi:', reason)
    })
  } catch (error) {
    console.error('Sunucu başlatılırken kritik hata:', error)
    process.exit(1)
  }
}

bootstrap()
