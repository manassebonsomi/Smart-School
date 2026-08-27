import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
export default class AuthMiddleware {
  redirectTo = '/'
  async handle(ctx: HttpContext, next: NextFn, options: { guards?: (keyof Authenticators)[] } = {}) {
    try {
      await ctx.auth.authenticateUsing(options.guards)
      return next()
    } catch (error) {
      if (ctx.request.accepts(['html', 'json']) === 'html') return ctx.response.redirect(this.redirectTo)
      throw error
    }
  }
}
