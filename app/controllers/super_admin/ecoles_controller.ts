import type { HttpContext } from '@adonisjs/core/http'
import EcoleService from '#services/super_admin/ecole_service'
import { createEcoleValidator } from '#validators/super_admin/ecole/create_ecole'
import { updateEcoleValidator } from '#validators/super_admin/ecole/update_ecole'
import { indexEcoleValidator } from '#validators/super_admin/ecole/index_ecole'

export default class EcoleController {

  private service = new EcoleService()

  /**
   * ============================================================================
   * Liste des écoles
   * ============================================================================
   */
  async index({ request, response }: HttpContext) {

    try {

      /* const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 10)) */

      /* const filters = {
        search: request.input('search'),
        statut: request.input('statut'),
      } */

      const filters = await request.validateUsing(indexEcoleValidator)
     // const result = await this.service.findAll(page, limit, filters)

      const result = await this.service.findAll(
        filters.page ?? 1,
        filters.limit ?? 10,
        filters)
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
   * Créer une école
   * ============================================================================
   */
  async store({ request, response }: HttpContext) {

    try {
      // const payload = request.all()
      const validatedPayload = await request.validateUsing(createEcoleValidator)
      const result = await this.service.create(validatedPayload)

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
   * Détails d'une école
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
   * Modifier une école
   * ============================================================================
   */
  async update({ params, request, response }: HttpContext) {

    try {

      //const payload = request.all()
      const validatedPayload = await request.validateUsing(updateEcoleValidator)
      const result = await this.service.update(Number(params.id), validatedPayload)

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
   * Suspendre une école
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
   * Réactiver une école
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
   * Archiver une école
   * ============================================================================
   */
  async archive({ params, response }: HttpContext) {

    try {

      const result = await this.service.archive(Number(params.id))

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
   * Suppression logique d'une école
   * ============================================================================
   */
  async destroy({ params, response }: HttpContext) {

    try {
      const result = await this.service.delete(Number(params.id))

      return response.ok(result)

    } catch(error: any) {


      return response.badRequest({
        success:false,
        message:error.message
      })

    }

  }

  /**
   * ============================================================================
   * Recherche avancée
   * ============================================================================
   */
  async search({ request, response }: HttpContext) {

    try {

      const keyword = request.input('search')
      const result =await this.service.search(keyword)

      return response.ok(result)


    } catch(error:any){

      return response.badRequest({
        success:false,
        message:error.message
      })

    }

  }


  /**
   * ============================================================================
   * Statistiques d'une école
   * ============================================================================
   */
  async statistics({ params, response }: HttpContext) {

    try {
      const result = await this.service.statistics(Number(params.id))

      return response.ok(result)

    } catch(error:any){

      return response.badRequest({
        success:false,
        message:error.message
      })

    }

  }

  /**
   * ============================================================================
   * Vérifier suppression possible
   * ============================================================================
   */
  async canDelete({ params, response }: HttpContext) {

    try {
      const result = await this.service.canDelete(Number(params.id))

      return response.ok({
        success:true,
        data:result
      })



    } catch(error:any){

      return response.badRequest({
        success:false,
        message:error.message
      })

    }

  }


  /**
   * ============================================================================
   * Vérifier existence école
   * ============================================================================
   */
  async exists({ params, response }: HttpContext) {

    try {

      const result = await this.service.exists(Number(params.id))

      return response.ok({
        success:true,
        exists:result
      })



    } catch(error:any){

      return response.badRequest({
        success:false,
        message:error.message
      })

    }

  }

}