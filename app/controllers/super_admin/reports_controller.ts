import type { HttpContext } from '@adonisjs/core/http'

import ReportService from '#services/super_admin/report_service'

export default class ReportsController {
  private service = new ReportService()

  /**
   * ==========================================================================
   * LISTE DES RAPPORTS DISPONIBLES
   * ==========================================================================
   *
   * GET /api/super-admin/reports
   *
   * Paramètre optionnel :
   * ?type=schools
   * ?type=users
   * ?type=students
   * ?type=platform
   */
  async index({
    request,
    response,
  }: HttpContext) {
    try {
      const type = request.input('type')

      const result = await this.service.list({
        type,
      })

      return response.ok(result)
    } catch (error: any) {
      console.error(
        'ReportsController.index:',
        error
      )

      return response.internalServerError({
        success: false,
        message:
          error.message ||
          'Impossible de récupérer les rapports disponibles.',
      })
    }
  }

  /**
   * ==========================================================================
   * GÉNÉRER UN RAPPORT
   * ==========================================================================
   *
   * POST /api/super-admin/reports
   *
   * Body :
   * {
   *   "type": "schools"
   * }
   */
  async store({
    request,
    response,
  }: HttpContext) {
    try {
      const type = String(
        request.input('type', '')
      )

      if (!type) {
        return response.badRequest({
          success: false,
          message:
            'Le type de rapport est obligatoire.',
        })
      }

      const result =
        await this.service.generate(type)

      return response.created(result)
    } catch (error: any) {
      console.error(
        'ReportsController.store:',
        error
      )

      return response.badRequest({
        success: false,
        message:
          error.message ||
          'Impossible de générer le rapport.',
      })
    }
  }

  /**
   * ==========================================================================
   * TÉLÉCHARGER UN RAPPORT
   * ==========================================================================
   *
   * GET /api/super-admin/reports/:type/download
   */
  async download({
    params,
    response,
  }: HttpContext) {
    try {
      const type =
        String(params.type)

      const content =
        await this.service.download(type)

      const filename =
        `smart-school-${type}.csv`

      response.header(
        'Content-Type',
        'text/csv; charset=utf-8'
      )

      response.header(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      )

      return response.send(
        `\ufeff${content}`
      )
    } catch (error: any) {
      console.error(
        'ReportsController.download:',
        error
      )

      return response.badRequest({
        success: false,
        message:
          error.message ||
          'Impossible de télécharger le rapport.',
      })
    }
  }
}