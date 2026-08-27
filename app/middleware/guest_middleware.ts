import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
export default class GuestMiddleware {
  redirectTo = '/'
  async handle(ctx: HttpContext, next: NextFn, options: { guards?: (keyof Authenticators)[] } = {}) {
    for (const guard of options.guards || [ctx.auth.defaultGuard]) {
      const auth = ctx.auth.use(guard)
      if (await auth.check()) {
        const user = auth.user
        const role = user?.systemRole
        const redirectTo = role === 'SUPER_ADMIN' ? '/super-admin/dashboard' : '/home'
        ctx.session.reflash()
        return ctx.response.redirect(redirectTo, true)
      }
    }
    return next()
  }
}
