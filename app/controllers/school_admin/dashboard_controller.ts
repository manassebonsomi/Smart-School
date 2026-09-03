import type { HttpContext } from '@adonisjs/core/http'
import DashboardService from '#services/school_admin/dashboard_service'

export default class SchoolAdminDashboardController {
  private service = new DashboardService()

  /**
   * --------------------------------------------------------------------------
   * PAGE HTML
   * --------------------------------------------------------------------------
   *
   * Cette méthode ne fait pas d'authentification.
   *
   * La page est un shell HTML rendu par Edge.
   * Les données réelles sont ensuite chargées côté navigateur par
   * dashboard.js via les endpoints API protégés.
   *
   * On fournit néanmoins les variables attendues par le template afin
   * qu'Edge puisse générer correctement la page.
   *
   * --------------------------------------------------------------------------
   */
  async dashboardPage({ view }: HttpContext) {
    return view.render(
      'pages/school-admin/dashboard',
      {
        user: {
          id: null,
          nom: '',
          postnom: '',
          prenom: '',
          pseudo: '',
          email: '',
          avatarUrl: null,
        },

        ecole: {
          id: null,
          nom: '',
          code: '',
          description: '',
          email: '',
          telephone: '',
          adresse: '',
          ville: '',
          pays: '',
          province: '',
          commune: '',
          quartier: '',
          siteWeb: '',
          type: '',
          anneeCreation: null,
          logo: null,
          statut: '',
        },

        role: '',
      }
    )
  }

  /**
   * --------------------------------------------------------------------------
   * API : DASHBOARD
   * --------------------------------------------------------------------------
   */
  async dashboard({
    auth,
    response,
  }: HttpContext) {
    try {
      return response.ok(
        await this.service.getDashboard(
          auth.user!.id
        )
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

  /**
   * --------------------------------------------------------------------------
   * API : ÉCOLES
   * --------------------------------------------------------------------------
   */
  async schools({
    auth,
    response,
  }: HttpContext) {
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

  /**
   * --------------------------------------------------------------------------
   * API : ÉCOLE ACTIVE
   * --------------------------------------------------------------------------
   */
  async activeSchool({
    auth,
    response,
  }: HttpContext) {
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