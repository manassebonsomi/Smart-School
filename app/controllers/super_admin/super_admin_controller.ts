import type { HttpContext } from '@adonisjs/core/http'
import SuperAdminService from '#services/super_admin/super_admin_service'

export default class SuperAdminController {

  private superAdminService = new SuperAdminService()


  /**
   * ==========================================================================
   * PROFIL DU SUPER ADMINISTRATEUR
   * GET /api/super-admin/profile
   * ==========================================================================
   */
  async profile({ auth, response }: HttpContext) {

    try {

      const user = await auth.authenticate()

      const result =
        await this.superAdminService.getProfile(user)

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.forbidden({
        success: false,
        message: error.message,
      })

    }
  }


  /**
   * ==========================================================================
   * VÉRIFICATION DES DROITS
   * GET /api/super-admin/check-access
   * ==========================================================================
   */
  async checkAccess({ auth, response }: HttpContext) {

    try {

      const user = await auth.authenticate()

      const result =
        await this.superAdminService.checkAccess(user)

      return response.ok(result)

    } catch (error: any) {

      return response.forbidden({
        success: false,
        message: error.message,
      })

    }
  }
}