import type { HttpContext } from '@adonisjs/core/http'

import UserContext from '#models/user_context'

export default class SchoolAdminMiddleware {

  async handle(
    { auth, response }: HttpContext,
    next: () => Promise<void>
  ) {
    const user =
      auth.user

    if (!user) {
      return response.status(401).json({
        success: false,
        message:
          'Authentification requise.',
      })
    }

    const context =
      await UserContext
        .query()
        .where(
          'user_id',
          user.id
        )
        .where(
          'active',
          true
        )
        .preload('ecole')
        .first()

    if (!context) {
      return response.status(403).json({
        success: false,
        message:
          'Aucune école active n’est associée à votre compte.',
      })
    }

    if (
      context.role !==
      'ADMIN_ECOLE'
    ) {
      return response.status(403).json({
        success: false,
        message:
          'Accès réservé à l’administrateur de l’école.',
      })
    }

    if (!context.ecole) {
      return response.status(403).json({
        success: false,
        message:
          'L’école actuellement sélectionnée est introuvable.',
      })
    }

    if (
      context.ecole.statut !==
      'ACTIF'
    ) {
      return response.status(403).json({
        success: false,
        message:
          'Cette école n’est pas active actuellement.',
      })
    }

    /**
     * Vérification supplémentaire :
     * le rattachement de l'utilisateur
     * à l'école doit encore être actif.
     */
    const membership =
      await context
        .ecole
        .related('utilisateurs')
        .query()
        .where(
          'users.id',
          user.id
        )
        .wherePivot(
          'role',
          'ADMIN_ECOLE'
        )
        .wherePivot(
          'statut',
          'ACTIF'
        )
        .first()

    if (!membership) {
      return response.status(403).json({
        success: false,
        message:
          'Votre accès administrateur à cette école n’est plus actif.',
      })
    }

    ;(user as any)
      .schoolAdminContext =
      context

    ;(user as any)
      .schoolAdminSchool =
      context.ecole

    await next()
  }
}