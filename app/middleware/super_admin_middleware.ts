import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { SystemRole } from '../enums/system_role.ts'

export default class SuperAdminMiddleware {

  async handle(
    { auth, response }: HttpContext,
    next: NextFn
  ) {

    const user = await auth.authenticateUsing(['api'])

    if (user.systemRole !== SystemRole.SUPER_ADMIN) {

      return response.forbidden({
        success: false,
        message: 'Accès réservé au Super Administrateur.',
      })

    }

    return next()
  }

}