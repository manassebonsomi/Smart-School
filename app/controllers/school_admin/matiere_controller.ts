import type { HttpContext } from '@adonisjs/core/http'

import MatiereService from '#services/school_admin/matiere_service'

export default class MatiereController {
  private service =
    new MatiereService()

  /**
   * --------------------------------------------------------------------------
   * PAGE
   * --------------------------------------------------------------------------
   */
  async indexPage({
    view,
  }: HttpContext) {
    return view.render(
      'pages/school-admin/matieres',
      {
        user: null,
        ecole: null,
        role: null,
      }
    )
  }

  /**
   * --------------------------------------------------------------------------
   * LISTE
   * --------------------------------------------------------------------------
   */
  async index({
    auth,
    request,
    response,
  }: HttpContext) {
    try {
      const user =
        auth.user

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié',
        })
      }

      const page =
        request.input(
          'page',
          1
        )

      const limit =
        request.input(
          'limit',
          10
        )

      const search =
        request.input(
          'search',
          ''
        )

      const statut =
        request.input(
          'statut',
          ''
        )

      const result =
        await this.service.list(
          user.id,
          {
            page,
            limit,
            search,
            statut,
          }
        )

      return response.ok(
        result
      )
    } catch (error) {
          return response.badRequest({
            success: false,
            message:
              error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * --------------------------------------------------------------------------
   * STATISTIQUES
   * --------------------------------------------------------------------------
   */
  async statistics({
    auth,
    response,
  }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié',
        })
      }

      const result =
        await this.service.statistics(
          user.id
        )

      return response.ok(
        result
      )
    } catch (error) {
          return response.badRequest({
            success: false,
            message:
              error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * --------------------------------------------------------------------------
   * DÉTAIL
   * --------------------------------------------------------------------------
   */
  async show({
    auth,
    params,
    response,
  }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié',
        })
      }

      const result =
        await this.service.find(
          user.id,
          Number(params.id)
        )

      return response.ok(
        result
      )
    } catch (error) {
          return response.badRequest({
            success: false,
            message:
              error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * --------------------------------------------------------------------------
   * CRÉATION
   * --------------------------------------------------------------------------
   */
  async store({
    auth,
    request,
    response,
  }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié',
        })
      }

      const result =
        await this.service.create(
          user.id,
          request.body()
        )

      return response.created(
        result
      )
    } catch (error) {
          return response.badRequest({
            success: false,
            message:
              error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * --------------------------------------------------------------------------
   * MODIFICATION
   * --------------------------------------------------------------------------
   */
  async update({
    auth,
    params,
    request,
    response,
  }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié',
        })
      }

      const result =
        await this.service.update(
          user.id,
          Number(params.id),
          request.body()
        )

      return response.ok(
        result
      )
    } catch (error) {
          return response.badRequest({
            success: false,
            message:
              error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * --------------------------------------------------------------------------
   * STATUT
   * --------------------------------------------------------------------------
   */
  async updateStatus({
    auth,
    params,
    request,
    response,
  }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié',
        })
      }

      const result =
        await this.service.setStatus(
          auth.user.id,
          Number(params.id),
          request.input(
            'statut'
          )
        )

      return response.ok(
        result
      )
    } catch (error) {
          return response.badRequest({
            success: false,
            message:
              error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * --------------------------------------------------------------------------
   * SUPPRESSION
   * --------------------------------------------------------------------------
   */
  async destroy({
    auth,
    params,
    response,
  }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié',
        })
      }

      const result =
        await this.service.remove(
          user.id,
          Number(params.id)
        )

      return response.ok(
        result
      )
    } catch (error) {
          return response.badRequest({
            success: false,
            message:
              error instanceof Error ? error.message : String(error),
      })
    }
  }
}