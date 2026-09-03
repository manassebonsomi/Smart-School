import type { HttpContext } from '@adonisjs/core/http'

import UserContext from '#models/user_context'
import EcoleUser from '#models/ecole_user'

export default class SchoolAdminMiddleware {
  async handle(
    { auth, response }: HttpContext,
    next: () => Promise<void>
  ) {
    const user = auth.user

    if (!user) {
      return response.status(401).json({
        success: false,
        message: 'Authentification requise.',
      })
    }

    const context = await UserContext
      .query()
      .where('user_id', user.id)
      .where('active', true)
      .preload('ecole')
      .first()

    if (!context) {
      return response.status(403).json({
        success: false,
        message: 'Aucune école active n’est associée à votre compte.',
      })
    }

    /*
     * Le rôle utilisé ici est le rôle scolaire actif.
     *
     * IMPORTANT :
     * on ne teste PAS user.systemRole.
     *
     * Un même User peut donc être :
     * - SUPER_ADMIN globalement ;
     * - ADMIN_ECOLE dans cette école ;
     * - TEACHER/PARENT dans une autre école.
     */
    if (context.role !== 'ADMIN_ECOLE') {
      return response.status(403).json({
        success: false,
        message: 'Accès réservé à l’administrateur de l’école.',
      })
    }

    if (!context.ecole) {
      return response.status(403).json({
        success: false,
        message: 'L’école actuellement sélectionnée est introuvable.',
      })
    }

    if (context.ecole.statut !== 'ACTIF') {
      return response.status(403).json({
        success: false,
        message: 'Cette école n’est pas active actuellement.',
      })
    }

    /*
     * Double vérification avec la relation réelle
     * utilisateur / école.
     */
    const membership = await EcoleUser
      .query()
      .where('user_id', user.id)
      .where('ecole_id', context.ecoleId)
      .where('role', 'ADMIN_ECOLE')
      .where('statut', 'ACTIF')
      .first()

    if (!membership) {
      return response.status(403).json({
        success: false,
        message:
          'Votre accès administrateur à cette école n’est plus actif.',
      })
    }

    ;(user as any).schoolAdminContext = context
    ;(user as any).schoolAdminSchool = context.ecole

    await next()
  }
}