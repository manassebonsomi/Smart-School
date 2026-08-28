import type { HttpContext } from '@adonisjs/core/http'

import StatisticsService from '#services/super_admin/statistics_service'


export default class StatisticsController {

  private service =
    new StatisticsService()


  /**
   * ==========================================================================
   * STATISTIQUES COMPLÈTES
   * ==========================================================================
   */
  async index({
    request,
    response,
  }: HttpContext) {

    try {

      const months =
        Number(
          request.input(
            'months',
            12
          )
        )


      return response.ok(
        await this.service.getOverview(
          months
        )
      )

    } catch (error: any) {

      console.error(
        'StatisticsController.index:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          error.message ||
          'Impossible de récupérer les statistiques.',

      })

    }

  }


  /**
   * ==========================================================================
   * VUE D'ENSEMBLE
   * ==========================================================================
   */
  async overview({
    response,
  }: HttpContext) {

    try {

      return response.ok({

        success:
          true,

        data:
          await this.service.getOverview(),

      })

    } catch (error: any) {

      console.error(
        'StatisticsController.overview:',
        error
      )


      return response.internalServerError({

        success: false,

        message:
          error.message ||
          'Impossible de récupérer les indicateurs.',

      })

    }

  }


  /**
   * ==========================================================================
   * ÉTAT DES ÉCOLES
   * ==========================================================================
   */
  async schools({
    response,
  }: HttpContext) {

    try {

      return response.ok({

        success:
          true,

        data:
          await this.service.getSchoolStatus(),

      })

    } catch (error: any) {

      return response.internalServerError({

        success:
          false,

        message:
          error.message ||
          'Impossible de récupérer les statistiques des écoles.',

      })

    }

  }


  /**
   * ==========================================================================
   * UTILISATEURS PAR RÔLE
   * ==========================================================================
   */
  async users({
    response,
  }: HttpContext) {

    try {

      return response.ok({

        success:
          true,

        data:
          await this.service.getUsersByRole(),

      })

    } catch (error: any) {

      return response.internalServerError({

        success:
          false,

        message:
          error.message ||
          'Impossible de récupérer la répartition des utilisateurs.',

      })

    }

  }


  /**
   * ==========================================================================
   * ÉVOLUTION
   * ==========================================================================
   */
  async monthly({
    request,
    response,
  }: HttpContext) {

    try {

      const months =
        Number(
          request.input(
            'months',
            12
          )
        )


      return response.ok({

        success:
          true,

        data:
          await this.service.getMonthlyEvolution(
            months
          ),

      })

    } catch (error: any) {

      return response.internalServerError({

        success:
          false,

        message:
          error.message ||
          'Impossible de récupérer l’évolution mensuelle.',

      })

    }

  }


  /**
   * ==========================================================================
   * ACTIVITÉ RÉCENTE
   * ==========================================================================
   */
  async activities({
    request,
    response,
  }: HttpContext) {

    try {

      const limit =
        Number(
          request.input(
            'limit',
            10
          )
        )


      return response.ok({

        success:
          true,

        data:
          await this.service.getRecentActivities(
            limit
          ),

      })

    } catch (error: any) {

      return response.internalServerError({

        success:
          false,

        message:
          error.message ||
          'Impossible de récupérer les activités récentes.',

      })

    }

  }

}