import { z } from 'zod'

export const updateSettingsSchema = z.record(
  z.string().min(1),
  z.string().max(2000)
)
