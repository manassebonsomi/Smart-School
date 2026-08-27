import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
export default class CorsMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const origin = request.header('origin')
    if (origin) response.header('Access-Control-Allow-Origin', origin)
    response.header('Vary', 'Origin')
    response.header('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS')
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
    response.header('Access-Control-Max-Age', '86400')
    if (request.method() === 'OPTIONS') return response.noContent()
    return next()
  }
}
