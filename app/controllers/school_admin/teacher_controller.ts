import type { HttpContext } from '@adonisjs/core/http'

import TeacherService from '#services/school_admin/teacher_service'

export default class TeacherController {
  private service =
    new TeacherService()

  async indexPage({
    view,
  }: HttpContext) {
    return view.render(
      'pages/school-admin/enseignants'
    )
  }

  async index({
    auth,
    request,
    response,
  }: HttpContext) {
    try {
      return response.ok(
        await this.service.list(
          auth.user!.id,
          {
            page:
              Number(
                request.input(
                  'page',
                  1
                )
              ),

            limit:
              Number(
                request.input(
                  'limit',
                  10
                )
              ),

            search:
              String(
                request.input(
                  'search',
                  ''
                )
              ).trim(),

            statut:
              String(
                request.input(
                  'statut',
                  ''
                )
              ).trim(),
          }
        )
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de charger les enseignants.',
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RECHERCHE UTILISATEURS
  |--------------------------------------------------------------------------
  */
  async searchUsers({
    auth,
    request,
    response,
  }: HttpContext) {
    try {
      const keyword =
        String(
          request.input(
            'keyword',
            ''
          )
        ).trim()

      const limit =
        Number(
          request.input(
            'limit',
            10
          )
        )

      return response.ok(
        await this.service.searchUsers(
          auth.user!.id,
          keyword,
          limit
        )
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de rechercher les utilisateurs.',
      })
    }
  }

  async statistics({
    auth,
    response,
  }: HttpContext) {
    try {
      return response.ok(
        await this.service.statistics(
          auth.user!.id
        )
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de charger les statistiques.',
      })
    }
  }

  async show({
    auth,
    params,
    response,
  }: HttpContext) {
    try {
      const id =
        Number(
          params.id
        )

      if (!id) {
        return response.badRequest({
          success: false,
          message:
            'Identifiant enseignant invalide.',
        })
      }

      return response.ok(
        await this.service.find(
          auth.user!.id,
          id
        )
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de récupérer cet enseignant.',
      })
    }
  }

  async store({
    auth,
    request,
    response,
  }: HttpContext) {
    try {
      const payload =
        request.only([
          'mode',
          'userId',
          'prenom',
          'nom',
          'postnom',
          'pseudo',
          'email',
          'telephone',
          'sexe',
          'password',
        ])

      return response.created(
        await this.service.create(
          auth.user!.id,
          payload
        )
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de créer l’enseignant.',
      })
    }
  }

  async update({
    auth,
    params,
    request,
    response,
  }: HttpContext) {
    try {
      const id =
        Number(
          params.id
        )

      if (!id) {
        return response.badRequest({
          success: false,

          message:
            'Identifiant enseignant invalide.',
        })
      }

      const payload =
        request.only([
          'prenom',
          'nom',
          'postnom',
          'pseudo',
          'email',
          'telephone',
          'sexe',
          'password',
        ])

      return response.ok(
        await this.service.update(
          auth.user!.id,
          id,
          payload
        )
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de modifier cet enseignant.',
      })
    }
  }

  async updateStatus({
    auth,
    params,
    request,
    response,
  }: HttpContext) {
    try {
      const id =
        Number(
          params.id
        )

      const statut =
        String(
          request.input(
            'statut',
            ''
          )
        ).trim()

      return response.ok(
        await this.service.setStatus(
          auth.user!.id,
          id,
          statut
        )
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de modifier le statut.',
      })
    }
  }

  async destroy({
    auth,
    params,
    response,
  }: HttpContext) {
    try {
      const id =
        Number(
          params.id
        )

      return response.ok(
        await this.service.remove(
          auth.user!.id,
          id
        )
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,

        message:
          error?.message ||
          'Impossible de retirer cet enseignant.',
      })
    }
  }
}