import type { HttpContext } from '@adonisjs/core/http'
import { SystemRole } from '../enums/system_role.ts'
import { NextFn } from '@adonisjs/core/types/http'

export default class SuperAdminMiddleware {
  async handle(
    { auth, response }: HttpContext,
    // next: () => Promise<void>
    next: NextFn
  ) {
    const user = await auth.authenticate()

    if (user.systemRole !== SystemRole.SUPER_ADMIN) {
      return response.forbidden({
        success: false,
        message: 'Accès réservé au super administrateur.',
      })
    }

    // await next()
    return next()
  }
}