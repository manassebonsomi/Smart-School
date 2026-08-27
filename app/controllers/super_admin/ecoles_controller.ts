import type { HttpContext } from '@adonisjs/core/http'

import EcoleService from '#services/super_admin/ecole_service'

import {
  createEcoleValidator,
} from '#validators/super_admin/ecole/create_ecole'

import {
  updateEcoleValidator,
} from '#validators/super_admin/ecole/update_ecole'

import {
  indexEcoleValidator,
} from '#validators/super_admin/ecole/index_ecole'


export default class EcoleController {

  private service = new EcoleService()


  /**
   * ==========================================================================
   * LISTE DES ÉCOLES
   * ==========================================================================
   */
  async index({
    request,
    response,
  }: HttpContext) {

    try {

      const filters = await request.validateUsing(
        indexEcoleValidator
      )

      const page =
        Number(filters.page ?? 1)

      const limit =
        Number(filters.limit ?? 10)


      return response.ok(
        await this.service.findAll(
          page,
          limit,
          filters
        )
      )

    } catch (error: any) {

      console.error(
        'EcoleController.index:',
        error
      )

      return response.badRequest({
        success: false,
        message:
          error.message ||
          'Impossible de récupérer les écoles.',
      })

    }

  }


  /**
   * ==========================================================================
   * CRÉER UNE ÉCOLE
   * ==========================================================================
   */
  async store({
    request,
    response,
  }: HttpContext) {

    try {

      const payload =
        await request.validateUsing(
          createEcoleValidator
        )


      const result =
        await this.service.create(
          payload
        )


      return response.created(
        result
      )

    } catch (error: any) {

      console.error(
        'EcoleController.store:',
        error
      )


      if (
        error.code === '23505' ||
        error.code === 'ECOLE_ALREADY_EXISTS'
      ) {

        return response.conflict({
          success: false,
          message:
            error.message ||
            'Une école avec ces informations existe déjà.',
        })

      }


      return response.badRequest({
        success: false,
        message:
          error.message ||
          'Impossible de créer l’école.',
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
      Number(params.id)


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return response.badRequest({
        success: false,
        message:
          'Identifiant d’école invalide.',
      })

    }


    return response.ok(
      await this.service.details(id)
    )

  } catch (error: any) {

    console.error(
      '===================================='
    )

    console.error(
      'ERREUR EcoleController.show'
    )

    console.error(
      'Message:',
      error?.message
    )

    console.error(
      'Code:',
      error?.code
    )

    console.error(
      'Stack:',
      error?.stack
    )

    console.error(
      '===================================='
    )


    if (
      error?.message ===
      "Cette école n'existe pas."
    ) {

      return response.notFound({

        success: false,

        message:
          'Cette école n’existe pas.',

      })

    }


    return response.internalServerError({

      success: false,

      message:
        error?.message ||
        'Impossible de récupérer les informations de cette école.',

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
        this.parseId(params.id)


      const payload =
        await request.validateUsing(
          updateEcoleValidator
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
        'EcoleController.update:',
        error
      )


      if (
        error.code === '23505'
      ) {

        return response.conflict({
          success: false,
          message:
            error.message ||
            'Une école avec ces informations existe déjà.',
        })

      }


      if (
        error.message === "Cette école n'existe pas."
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
          'Impossible de modifier l’école.',
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
        this.parseId(params.id)


      return response.ok(
        await this.service.suspend(id)
      )

    } catch (error: any) {

      console.error(
        'EcoleController.suspend:',
        error
      )


      return this.handleSchoolActionError(
        response,
        error,
        'Impossible de suspendre l’école.'
      )

    }

  }


  /**
   * ==========================================================================
   * ACTIVER
   * ==========================================================================
   */
  async activate({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(params.id)


      return response.ok(
        await this.service.activate(id)
      )

    } catch (error: any) {

      console.error(
        'EcoleController.activate:',
        error
      )


      return this.handleSchoolActionError(
        response,
        error,
        'Impossible de réactiver l’école.'
      )

    }

  }


  /**
   * ==========================================================================
   * ARCHIVER
   * ==========================================================================
   */
  async archive({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(params.id)


      return response.ok(
        await this.service.archive(id)
      )

    } catch (error: any) {

      console.error(
        'EcoleController.archive:',
        error
      )


      return this.handleSchoolActionError(
        response,
        error,
        'Impossible d’archiver l’école.'
      )

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
        this.parseId(params.id)


      return response.ok(
        await this.service.delete(id)
      )

    } catch (error: any) {

      console.error(
        'EcoleController.destroy:',
        error
      )


      if (
        error.code === 'ECOLE_CANNOT_DELETE'
      ) {

        return response.conflict({
          success: false,
          message:
            error.message ||
            'Cette école ne peut pas être supprimée.',
        })

      }


      return this.handleSchoolActionError(
        response,
        error,
        'Impossible de supprimer l’école.'
      )

    }

  }


  /**
   * ==========================================================================
   * RECHERCHE RAPIDE
   * ==========================================================================
   */
  async search({
    request,
    response,
  }: HttpContext) {

    try {

      const search =
        String(
          request.input(
            'search',
            ''
          )
        ).trim()


      return response.ok(
        await this.service.search(
          search
        )
      )

    } catch (error: any) {

      console.error(
        'EcoleController.search:',
        error
      )


      return response.badRequest({
        success: false,
        message:
          error.message ||
          'Impossible d’effectuer la recherche.',
      })

    }

  }


  /**
   * ==========================================================================
   * STATISTIQUES D'UNE ÉCOLE
   * ==========================================================================
   */
  async statistics({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(params.id)


      return response.ok(
        await this.service.statistics(id)
      )

    } catch (error: any) {

      console.error(
        'EcoleController.statistics:',
        error
      )


      if (
        error.message === "Cette école n'existe pas."
      ) {

        return response.notFound({
          success: false,
          message:
            'Cette école n’existe pas.',
        })

      }


      return response.badRequest({
        success: false,
        message:
          error.message ||
          'Impossible de récupérer les statistiques.',
      })

    }

  }


  /**
   * ==========================================================================
   * PEUT ÊTRE SUPPRIMÉE ?
   * ==========================================================================
   */
  async canDelete({
    params,
    response,
  }: HttpContext) {

    try {

      const id =
        this.parseId(params.id)


      return response.ok({
        success: true,
        data:
          await this.service.canDelete(id),
      })

    } catch (error: any) {

      console.error(
        'EcoleController.canDelete:',
        error
      )


      return response.badRequest({
        success: false,
        message:
          error.message ||
          'Impossible de vérifier la suppression.',
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
        this.parseId(params.id)


      return response.ok({

        success: true,

        exists:
          await this.service.exists(id),

      })

    } catch (error: any) {

      console.error(
        'EcoleController.exists:',
        error
      )


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
   * UTILITAIRES
   * ==========================================================================
   */

  private parseId(
    value: string
  ): number {

    const id =
      Number(value)


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      throw new Error(
        'Identifiant d’école invalide.'
      )

    }


    return id

  }


  private handleSchoolActionError(
    response: HttpContext['response'],
    error: any,
    fallbackMessage: string
  ) {

    if (
      error.message === "Cette école n'existe pas."
    ) {

      return response.notFound({
        success: false,
        message:
          'Cette école n’existe pas.',
      })

    }


    return response.badRequest({
      success: false,
      message:
        error.message ||
        fallbackMessage,
    })

  }

}