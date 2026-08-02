import type { HttpContext } from '@adonisjs/core/http'
import AdministrateurService from '#services/super_admin/administrateur_service'
import { createAdministrateurValidator} from '#validators/super_admin/administrateur/create_administrateur'
import { updateAdministrateurValidator } from '#validators/super_admin/administrateur/update_administrateur'
import { indexAdministrateurValidator } from '#validators/super_admin/administrateur/index_administrateur'

export default class AdministrateurController {

  private service = new AdministrateurService()

  /**
   * ============================================================================
   * Liste des administrateurs
   * ============================================================================
   */
  async index({ request, response }: HttpContext) {

    try {

      const filters = await request.validateUsing(indexAdministrateurValidator)
      const result = await this.service.findAll(
        filters.page ?? 1,
        filters.limit ?? 10,
        filters
      )

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Créer un administrateur
   * ============================================================================
   */
  async store({ request, response }: HttpContext) {

    try {

      const payload = await request.validateUsing(createAdministrateurValidator)
      /* const ecoleId = Number(request.input('ecole_id'))
      const result = await this.service.create(ecoleId, payload) */

      const result = await this.service.create(payload.ecoleId, payload)

      return response.created(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Détails d'un administrateur
   * ============================================================================
   */
  async show({ params, response }: HttpContext) {

    try {

      const result = await this.service.details(Number(params.id))

      return response.ok(result)

    } catch (error: any) {

      return response.notFound({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Modifier un administrateur
   * ============================================================================
   */
  async update({ params, request, response }: HttpContext) {

    try {

      const payload = await request.validateUsing(updateAdministrateurValidator)
      const result = await this.service.update(Number(params.id), payload)

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Suspendre un administrateur
   * ============================================================================
   */
  async suspend({ params, response }: HttpContext) {

    try {
      const result = await this.service.suspend(Number(params.id))

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Réactiver un administrateur
   * ============================================================================
   */
  async activate({ params, response }: HttpContext) {

    try {

      const result = await this.service.activate(Number(params.id))
      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

    /**
   * ============================================================================
   * Supprimer logiquement un administrateur
   * ============================================================================
   */
  async destroy({ params, response }: HttpContext) {

    try {

      const result = await this.service.delete(Number(params.id))
      return response.ok(result)

    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Suppression définitive
   * ============================================================================
   */
  async forceDelete({ params, response }: HttpContext) {

    try {
      const result = await this.service.forceDelete(Number(params.id))
      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Statistiques des administrateurs
   * ============================================================================
   */
  async statistics({ response }: HttpContext) {

    try {
      const result = await this.service.statistics()
      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Administrateurs d'une école
   * ============================================================================
   */
  async getBySchool({ params, response }: HttpContext) {

    try {
      const result = await this.service.getBySchool(Number(params.ecoleId))
      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Changer d'école active
   * ============================================================================
   */
  async switchSchool({ params, request, response }: HttpContext) {

    try {

      const result = await this.service.switchSchool(Number(params.id), Number(request.input('ecoleId')))

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Vérifier l'appartenance à une école
   * ============================================================================
   */
  async belongsToSchool({ params, response }: HttpContext) {

    try {

      const result = await this.service.belongsToSchool(Number(params.id), Number(params.ecoleId))

      return response.ok({
        success: true,
        belongs: result,
      })

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ============================================================================
   * Vérifier l'existence d'un administrateur
   * ============================================================================
   */
  async exists({ params, response }: HttpContext) {

    try {
      const administrateur = await this.service.details(Number(params.id))

      return response.ok({
        success: true,
        exists: !!administrateur,
      })

    } catch {

      return response.ok({
        success: true,
        exists: false,
      })

    }

  }

}