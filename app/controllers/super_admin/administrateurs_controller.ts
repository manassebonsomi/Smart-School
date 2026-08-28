import type { HttpContext } from '@adonisjs/core/http'

import AdministrateurService from '#services/super_admin/administrateur_service'

import {
  createAdministrateurValidator,
} from '#validators/super_admin/administrateur/create_administrateur'

import {
  updateAdministrateurValidator,
} from '#validators/super_admin/administrateur/update_administrateur'

import {
  indexAdministrateurValidator,
} from '#validators/super_admin/administrateur/index_administrateur'


export default class AdministrateurController {

  private service =
    new AdministrateurService()


  /**
   * ==========================================================================
   * LISTE DES ADMINISTRATEURS
   * ==========================================================================
   */
  async index({
    request,
    response,
  }: HttpContext) {

    try {

      const filters =
        await request.validateUsing(
          indexAdministrateurValidator
        )


      const page =
        Number(
          filters.page ?? 1
        )


      const limit =
        Number(
          filters.limit ?? 10
        )


      const result =
        await this.service.findAll(
          page,
          limit,
          filters
        )


      return response.ok(
        result
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.index:',
        error
      )


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de récupérer les administrateurs.',

      })

    }

  }


  /**
   * ==========================================================================
   * CRÉER UN ADMINISTRATEUR
   * ==========================================================================
   */
  async store({
    request,
    response,
  }: HttpContext) {

    try {

      const payload =
        await request.validateUsing(
          createAdministrateurValidator
        )


      const result =
        await this.service.create(
          Number(payload.ecoleId),
          payload
        )


      return response.created(
        result
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.store:',
        error
      )


      if (
        error.code === '23505'
      ) {

        return response.conflict({

          success: false,

          message:
            error.message ||
            'Un administrateur avec ces informations existe déjà.',

        })

      }


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de créer l’administrateur.',

      })

    }

  }


  /**
   * ==========================================================================
   * DÉTAILS
   * ==========================================================================
   */
  async show({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(
          params.id
        )


      const result =
        await this.service.details(
          id
        )


      return response.ok(
        result
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.show:',
        error
      )


      if (
        error.message ===
        'Administrateur introuvable.'
      ) {

        return response.notFound({

          success: false,

          message:
            'Administrateur introuvable.',

        })

      }


      return response.internalServerError({

        success: false,

        message:
          error.message ||
          'Impossible de récupérer les informations de cet administrateur.',

      })

    }

  }


  /**
   * ==========================================================================
   * MODIFIER
   * ==========================================================================
   */
  async update({
    params,
    request,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(
          params.id
        )


      const payload =
        await request.validateUsing(
          updateAdministrateurValidator
        )


      const result =
        await this.service.update(
          id,
          payload
        )


      return response.ok(
        result
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.update:',
        error
      )


      if (
        error.code === '23505'
      ) {

        return response.conflict({

          success: false,

          message:
            error.message ||
            'Cette adresse email ou ce numéro existe déjà.',

        })

      }


      if (
        error.message ===
        'Administrateur introuvable.'
      ) {

        return response.notFound({

          success: false,

          message:
            error.message,

        })

      }


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de modifier l’administrateur.',

      })

    }

  }


  /**
   * ==========================================================================
   * SUSPENDRE
   * ==========================================================================
   */
  async suspend({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(
          params.id
        )


      return response.ok(
        await this.service.suspend(id)
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.suspend:',
        error
      )


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de suspendre l’administrateur.',

      })

    }

  }


  /**
   * ==========================================================================
   * RÉACTIVER
   * ==========================================================================
   */
  async activate({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(
          params.id
        )


      return response.ok(
        await this.service.activate(id)
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.activate:',
        error
      )


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de réactiver l’administrateur.',

      })

    }

  }


  /**
   * ==========================================================================
   * SUPPRESSION LOGIQUE
   * ==========================================================================
   */
  async destroy({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(
          params.id
        )


      return response.ok(
        await this.service.delete(id)
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.destroy:',
        error
      )


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de supprimer l’administrateur.',

      })

    }

  }


  /**
   * ==========================================================================
   * SUPPRESSION PHYSIQUE
   * ==========================================================================
   */
  async forceDelete({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(
          params.id
        )


      return response.ok(
        await this.service.forceDelete(id)
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.forceDelete:',
        error
      )


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de supprimer définitivement l’administrateur.',

      })

    }

  }


  /**
   * ==========================================================================
   * STATISTIQUES
   * ==========================================================================
   */
  async statistics({
    response,
  }: HttpContext) {

    try {

      const result =
        await this.service.statistics()


      return response.ok({

        success: true,

        data: result,

      })

    } catch (error: any) {

      console.error(
        'AdministrateurController.statistics:',
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
   * ADMINISTRATEURS D'UNE ÉCOLE
   * ==========================================================================
   */
  async getBySchool({
    params,
    response,
  }: HttpContext) {

    try {

      const ecoleId =
        this.parseId(
          params.id
            ?? params.ecoleId
        )


      return response.ok(
        await this.service.getBySchool(
          ecoleId
        )
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.getBySchool:',
        error
      )


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de récupérer les administrateurs de cette école.',

      })

    }

  }


  /**
   * ==========================================================================
   * CHANGER D'ÉCOLE ACTIVE
   * ==========================================================================
   */
  async switchSchool({
    params,
    request,
    response,
  }: HttpContext) {

    try {

      const userId =
        this.parseId(
          params.id
        )


      const ecoleId =
        this.parseId(
          request.input(
            'ecoleId'
          )
        )


      return response.ok(
        await this.service.switchSchool(
          userId,
          ecoleId
        )
      )

    } catch (error: any) {

      console.error(
        'AdministrateurController.switchSchool:',
        error
      )


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de changer l’école active.',

      })

    }

  }


  /**
   * ==========================================================================
   * APPARTENANCE
   * ==========================================================================
   */
  async belongsToSchool({
    params,
    response,
  }: HttpContext) {

    try {

      const userId =
        this.parseId(
          params.id
        )


      const ecoleId =
        this.parseId(
          params.ecoleId
        )


      return response.ok({

        success: true,

        belongs:
          await this.service.belongsToSchool(
            userId,
            ecoleId
          ),

      })

    } catch (error: any) {

      console.error(
        'AdministrateurController.belongsToSchool:',
        error
      )


      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de vérifier l’appartenance.',

      })

    }

  }


  /**
   * ==========================================================================
   * EXISTENCE
   * ==========================================================================
   */
  async exists({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(
          params.id
        )


      return response.ok({

        success: true,

        exists:
          await this.service.exists(
            id
          ),

      })

    } catch (error: any) {

      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de vérifier l’existence.',

      })

    }

  }


  /**
   * ==========================================================================
   * PARSE ID
   * ==========================================================================
   */
  private parseId(
    value: unknown
  ): number {

    const id =
      Number(value)


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      throw new Error(
        'Identifiant invalide.'
      )

    }


    return id

  }

}