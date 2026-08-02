import type { HttpContext } from '@adonisjs/core/http'
import DashboardService from '#services/super_admin/dashboard_service'

export default class DashboardController {

  private service = new DashboardService()

  /**
   * ============================================================================
   * Dashboard complet
   * ============================================================================
   */
  async index({ response }: HttpContext) {

    try {

      const dashboard = await this.service.getFullDashboard()
      return response.ok(dashboard)

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Statistiques générales
   * ============================================================================
   */
  async statistics({ response }: HttpContext) {

    try {

      const statistics = await this.service.getStatistics()

      return response.ok({
        success: true,
        data: statistics,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Statistiques des écoles
   * ============================================================================
   */
  async schools({ response }: HttpContext) {

    try {

      const schools = await this.service.getSchoolsByStatus()

      return response.ok({
        success: true,
        data: schools,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Statistiques des utilisateurs
   * ============================================================================
   */
  async users({ response }: HttpContext) {

    try {

      const users = await this.service.getUsersByRole()

      return response.ok({
        success: true,
        data: users,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }


    /**
   * ============================================================================
   * Dernières écoles créées
   * ============================================================================
   */
  async recentSchools({ request, response }: HttpContext) {

    try {

      const limit = Number(request.input('limit', 10))
      const result = await this.service.getRecentSchools(limit)

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Derniers administrateurs créés
   * ============================================================================
   */
  async recentAdministrators({ request, response }: HttpContext) {

    try {

      const limit = Number(request.input('limit', 10))
      const result = await this.service.getRecentAdministrators(limit)

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Top écoles
   * ============================================================================
   */
  async topSchools({ request, response }: HttpContext) {

    try {

      const limit = Number(request.input('limit', 5))
      const result = await this.service.getTopSchools(limit)

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Statistiques détaillées des écoles
   * ============================================================================
   */
  async schoolsStatistics({ response }: HttpContext) {

    try {

      const result = await this.service.getSchoolsWithStatistics()

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Activités récentes
   * ============================================================================
   */
  async activities({ request, response }: HttpContext) {

    try {

      const limit = Number(request.input('limit', 10))
      const result = await this.service.getRecentActivities(limit)

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Evolution mensuelle des écoles
   * ============================================================================
   */
  async monthlySchools({ request, response }: HttpContext) {

    try {

      const year = Number(request.input('year', new Date().getFullYear()))
      const result = await this.service.getMonthlySchools(year)

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Evolution mensuelle des utilisateurs
   * ============================================================================
   */
  async monthlyUsers({ request, response }: HttpContext) {

    try {

      const year = Number(request.input('year', new Date().getFullYear()))
      const result = await this.service.getMonthlyUsers(year)

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Santé du système
   * ============================================================================
   */
  async systemHealth({ response }: HttpContext) {

    try {

      const result = await this.service.getSystemHealth()

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.internalServerError({
        success: false,
        message: error.message,
      })

    }

  }

}