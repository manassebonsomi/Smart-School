import type { HttpContext } from '@adonisjs/core/http'

import DashboardService from '#services/super_admin/dashboard_service'


export default class DashboardController {

  private service =
    new DashboardService()


  /**
   * ==========================================================================
   * DASHBOARD COMPLET
   * ==========================================================================
   */
  async index({ response }: HttpContext) {

    try {

      const result =
        await this.service.getFullDashboard()


      return response.ok(result)

    } catch (error: any) {

      console.error(
        'DashboardController.index:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger les données du tableau de bord.',

      })

    }

  }


  /**
   * ==========================================================================
   * STATISTIQUES
   * ==========================================================================
   */
  async statistics({ response }: HttpContext) {

    try {

      const result =
        await this.service.getStatistics()


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.statistics:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger les statistiques.',

      })

    }

  }


  /**
   * ==========================================================================
   * ÉCOLES PAR STATUT
   * ==========================================================================
   */
  async schools({ response }: HttpContext) {

    try {

      const result =
        await this.service.getSchoolsByStatus()


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.schools:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger les statistiques des écoles.',

      })

    }

  }


  /**
   * ==========================================================================
   * UTILISATEURS PAR RÔLE
   * ==========================================================================
   */
  async users({ response }: HttpContext) {

    try {

      const result =
        await this.service.getUsersByRole()


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.users:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger les statistiques des utilisateurs.',

      })

    }

  }


  /**
   * ==========================================================================
   * ÉCOLES RÉCENTES
   * ==========================================================================
   */
  async recentSchools({
    request,
    response,
  }: HttpContext) {

    try {

      const limit =
        Number(
          request.input('limit', 5)
        )


      const result =
        await this.service.getRecentSchools(limit)


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.recentSchools:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger les écoles récentes.',

      })

    }

  }


  /**
   * ==========================================================================
   * ADMINISTRATEURS RÉCENTS
   * ==========================================================================
   */
  async recentAdministrators({
    request,
    response,
  }: HttpContext) {

    try {

      const limit =
        Number(
          request.input('limit', 5)
        )


      const result =
        await this.service.getRecentAdministrators(limit)


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.recentAdministrators:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger les administrateurs récents.',

      })

    }

  }


  /**
   * ==========================================================================
   * TOP ÉCOLES
   * ==========================================================================
   */
  async topSchools({
    request,
    response,
  }: HttpContext) {

    try {

      const limit =
        Number(
          request.input('limit', 5)
        )


      const result =
        await this.service.getTopSchools(limit)


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.topSchools:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger le classement des écoles.',

      })

    }

  }


  /**
   * ==========================================================================
   * STATISTIQUES DES ÉCOLES
   * ==========================================================================
   */
  async schoolsStatistics({
    response,
  }: HttpContext) {

    try {

      const result =
        await this.service.getSchoolsWithStatistics()


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.schoolsStatistics:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger les statistiques des écoles.',

      })

    }

  }


  /**
   * ==========================================================================
   * ACTIVITÉS
   * ==========================================================================
   */
  async activities({
    request,
    response,
  }: HttpContext) {

    try {

      const limit =
        Number(
          request.input('limit', 10)
        )


      const result =
        await this.service.getRecentActivities(limit)


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.activities:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger les activités récentes.',

      })

    }

  }


  /**
   * ==========================================================================
   * ÉVOLUTION MENSUELLE DES ÉCOLES
   * ==========================================================================
   */
  async monthlySchools({
    request,
    response,
  }: HttpContext) {

    try {

      const year =
        Number(
          request.input(
            'year',
            new Date().getFullYear()
          )
        )


      const result =
        await this.service.getMonthlySchools(year)


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.monthlySchools:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger la croissance des écoles.',

      })

    }

  }


  /**
   * ==========================================================================
   * ÉVOLUTION MENSUELLE DES UTILISATEURS
   * ==========================================================================
   */
  async monthlyUsers({
    request,
    response,
  }: HttpContext) {

    try {

      const year =
        Number(
          request.input(
            'year',
            new Date().getFullYear()
          )
        )


      const result =
        await this.service.getMonthlyUsers(year)


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.monthlyUsers:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de charger la croissance des utilisateurs.',

      })

    }

  }


  /**
   * ==========================================================================
   * SANTÉ DU SYSTÈME
   * ==========================================================================
   */
  async systemHealth({ response }: HttpContext) {

    try {

      const result =
        await this.service.getSystemHealth()


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'DashboardController.systemHealth:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          'Impossible de vérifier la santé du système.',

      })

    }

  }

}