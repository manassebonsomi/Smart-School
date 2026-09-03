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
  private service =
    new EcoleService()

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
      const filters =
        await request.validateUsing(
          indexEcoleValidator
        )

      const page =
        Number(
          filters.page ??
          1
        )

      const limit =
        Number(
          filters.limit ??
          10
        )

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

      if (
        error?.status === 422 ||
        error?.statusCode === 422
      ) {
        return response.unprocessableEntity({
          success: false,

          message:
            error?.message ||
            'Les critères de recherche sont invalides.',
        })
      }

      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de récupérer les écoles.',
      })
    }
  }

  /**
   * ==========================================================================
   * CRÉER UNE ÉCOLE
   * ==========================================================================
   *
   * Peut être utilisée :
   *
   * - sans administrateur ;
   * - avec admin.mode = "new" ;
   * - avec admin.mode = "existing".
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

      /**
       * ----------------------------------------------------------------------
       * Validation métier de l'administrateur
       * ----------------------------------------------------------------------
       *
       * La validation structurelle est faite par Vine.
       * Ici, on vérifie les champs qui dépendent du mode.
       */
      if (
        payload.admin
      ) {
        const mode =
          payload.admin.mode ??
          'new'

        /**
         * ---------------------------------------------------------------
         * Administrateur existant
         * ---------------------------------------------------------------
         */
        if (
          mode ===
          'existing'
        ) {
          if (
            payload.admin.userId ===
              undefined ||
            payload.admin.userId ===
              null
          ) {
            return response.unprocessableEntity({
              success: false,

              message:
                "L'identifiant de l'utilisateur existant est obligatoire.",
            })
          }
        }

        /**
         * ---------------------------------------------------------------
         * Nouvel administrateur
         * ---------------------------------------------------------------
         */
        if (
          mode ===
          'new'
        ) {
          if (
            !payload.admin.nom ||
            String(
              payload.admin.nom
            ).trim() === ''
          ) {
            return response.unprocessableEntity({
              success: false,

              message:
                'Le nom de l’administrateur est obligatoire.',
            })
          }

          if (
            !payload.admin.prenom ||
            String(
              payload.admin.prenom
            ).trim() === ''
          ) {
            return response.unprocessableEntity({
              success: false,

              message:
                'Le prénom de l’administrateur est obligatoire.',
            })
          }

          if (
            !payload.admin.email ||
            String(
              payload.admin.email
            ).trim() === ''
          ) {
            return response.unprocessableEntity({
              success: false,

              message:
                "L'adresse email de l'administrateur est obligatoire.",
            })
          }

          if (
            !payload.admin.password ||
            String(
              payload.admin.password
            ).length < 8
          ) {
            return response.unprocessableEntity({
              success: false,

              message:
                'Le mot de passe de l’administrateur doit contenir au moins 8 caractères.',
            })
          }

          if (
            payload.admin.password_confirmation !==
              undefined &&
            payload.admin.password_confirmation !==
              payload.admin.password
          ) {
            return response.unprocessableEntity({
              success: false,

              message:
                'La confirmation du mot de passe ne correspond pas au mot de passe.',
            })
          }
        }
      }

      /**
       * ----------------------------------------------------------------------
       * Création de l'école
       * ----------------------------------------------------------------------
       */
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

      /**
       * Erreurs de validation.
       */
      if (
        error?.status === 422 ||
        error?.statusCode === 422
      ) {
        return response.unprocessableEntity({
          success: false,

          message:
            error?.message ||
            'Les données fournies sont invalides.',
        })
      }

      /**
       * Erreurs d'unicité.
       */
      if (
        error?.code === '23505' ||
        error?.code === 'ER_DUP_ENTRY' ||
        error?.code === 'E_ROW_DUPLICATE' ||
        error?.code === 'ECOLE_ALREADY_EXISTS'
      ) {
        return response.conflict({
          success: false,

          message:
            error?.message ||
            'Une école avec ces informations existe déjà.',
        })
      }

      /**
       * Doublon administratif explicite.
       */
      if (
        error?.message ===
        'Cet utilisateur est déjà administrateur de cette école.'
      ) {
        return response.conflict({
          success: false,

          message:
            error.message,
        })
      }

      return response.badRequest({
        success: false,

        message:
          error?.message ||
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
        this.parseId(
          params.id
        )

      return response.ok(
        await this.service.details(
          id
        )
      )
    } catch (error: any) {
      console.error(
        'EcoleController.show:',
        error
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

      if (
        error?.message ===
        'Identifiant d’école invalide.'
      ) {
        return response.badRequest({
          success: false,

          message:
            error.message,
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
        this.parseId(
          params.id
        )

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
        error?.status === 422 ||
        error?.statusCode === 422
      ) {
        return response.unprocessableEntity({
          success: false,

          message:
            error?.message ||
            'Les données fournies sont invalides.',
        })
      }

      if (
        error?.code === '23505' ||
        error?.code === 'ER_DUP_ENTRY' ||
        error?.code === 'E_ROW_DUPLICATE'
      ) {
        return response.conflict({
          success: false,

          message:
            error?.message ||
            'Une école avec ces informations existe déjà.',
        })
      }

      if (
        error?.message ===
        "Cette école n'existe pas."
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
          error?.message ||
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
        this.parseId(
          params.id
        )

      return response.ok(
        await this.service.suspend(
          id
        )
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
        this.parseId(
          params.id
        )

      return response.ok(
        await this.service.activate(
          id
        )
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
        this.parseId(
          params.id
        )

      return response.ok(
        await this.service.archive(
          id
        )
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
        this.parseId(
          params.id
        )

      return response.ok(
        await this.service.delete(
          id
        )
      )
    } catch (error: any) {
      console.error(
        'EcoleController.destroy:',
        error
      )

      if (
        error?.code ===
        'ECOLE_CANNOT_DELETE'
      ) {
        return response.conflict({
          success: false,

          message:
            error?.message ||
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
   *
   * Endpoint :
   *
   * GET /api/super-admin/ecoles/search
   *
   * Paramètres acceptés :
   *
   * - keyword
   * - search (compatibilité avec l'ancien frontend)
   * - limit
   *
   * Exemple :
   *
   * /api/super-admin/ecoles/search?keyword=kin&limit=10
   */
  async search({
    request,
    response,
  }: HttpContext) {
    try {
      /**
       * Le nouveau frontend utilise "keyword".
       * L'ancien code pouvait utiliser "search".
       */
      const keyword =
        String(
          request.input(
            'keyword',
            request.input(
              'search',
              ''
            )
          )
        ).trim()

      const limit =
        Math.min(
          Math.max(
            Number(
              request.input(
                'limit',
                10
              )
            ) || 10,
            1
          ),
          50
        )

      return response.ok(
        await this.service.search(
          keyword,
          limit
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
          error?.message ||
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
        this.parseId(
          params.id
        )

      return response.ok(
        await this.service.statistics(
          id
        )
      )
    } catch (error: any) {
      console.error(
        'EcoleController.statistics:',
        error
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

      return response.badRequest({
        success: false,

        message:
          error?.message ||
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
        this.parseId(
          params.id
        )

      return response.ok({
        success: true,

        data:
          await this.service.canDelete(
            id
          ),
      })
    } catch (error: any) {
      console.error(
        'EcoleController.canDelete:',
        error
      )

      return response.badRequest({
        success: false,

        message:
          error?.message ||
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
      console.error(
        'EcoleController.exists:',
        error
      )

      return response.badRequest({
        success: false,

        message:
          error?.message ||
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
    value: unknown
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

  /**
   * ==========================================================================
   * GESTION DES ERREURS D'ACTIONS SUR UNE ÉCOLE
   * ==========================================================================
   */
  private handleSchoolActionError(
    response: HttpContext['response'],
    error: any,
    fallbackMessage: string
  ) {
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

    if (
      error?.message ===
      'Identifiant d’école invalide.'
    ) {
      return response.badRequest({
        success: false,

        message:
          error.message,
      })
    }

    return response.badRequest({
      success: false,

      message:
        error?.message ||
        fallbackMessage,
    })
  }
}