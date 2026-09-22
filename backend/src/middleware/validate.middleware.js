import { ZodError } from 'zod'
import { ValidationError } from '../utils/api-error.js'

/**
 * Zod şemalarını kullanarak body, query ve params doğrulayan middleware üretir.
 * @param {{ body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny }} schemas 
 */
export function validate(schemas) {
  return async (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query)
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        })
      }
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params)
        Object.defineProperty(req, 'params', {
          value: parsedParams,
          writable: true,
          enumerable: true,
          configurable: true,
        })
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))
        next(new ValidationError('Girdi doğrulama hatası', issues))
      } else {
        next(error)
      }
    }
  }
}
