import type { HttpContext } from '@adonisjs/core/http'
import DashboardService from '#services/school_admin/dashboard_service'

export default class SchoolAdminDashboardController {
  private service = new DashboardService()

  async dashboardPage({
    auth,
    view,
    response,
  }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.redirect('/')
    }

    try {
      const context = await this.service.getContext(user.id)

      return view.render(
        'pages/school-admin/dashboard',
        {
          user: {
            id: user.id,
            nom: user.nom,
            postnom: user.postnom,
            prenom: user.prenom,
            pseudo: user.pseudo,
            email: user.email,
            avatarUrl: user.avatarUrl,
          },

          ecole: context.ecole,

          role: context.role,
        }
      )
    } catch {
      return response.redirect('/')
    }
  }

  async dashboard({ auth, response }: HttpContext) {
    try {
      return response.ok(
        await this.service.getDashboard(auth.user!.id)
      )
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message:
          error?.message ||
          'Impossible de charger le tableau de bord.',
      })
    }
  }

  async schools({ auth, response }: HttpContext) {
    try {
      return response.ok({
        success: true,
        data: await this.service.getSchools(
          auth.user!.id
        ),
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message:
          error?.message ||
          'Impossible de charger vos écoles.',
      })
    }
  }

  async activeSchool({ auth, response }: HttpContext) {
    try {
      return response.ok({
        success: true,

        data: await this.service.getActiveSchool(
          auth.user!.id
        ),
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message:
          error?.message ||
          'Impossible de charger l’école active.',
      })
    }
  }
}