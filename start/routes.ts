import { middleware } from '#start/kernel'

import router from '@adonisjs/core/services/router'

import GoogleAuthController from '#controllers/google_auths_controller'
import ForgotPasswordsController from '#controllers/forgot_passwords_controller'
import AuthController from '#controllers/auth_controller'

import ReportsController from '#controllers/super_admin/reports_controller'
import StatisticsController from '#controllers/super_admin/statistics_controller'

/*
|--------------------------------------------------------------------------
| CONTROLLERS SUPER ADMIN
|--------------------------------------------------------------------------
*/

const SuperAdminController = () =>
  import('#controllers/super_admin/super_admin_controller')

const EcoleController = () =>
  import('#controllers/super_admin/ecoles_controller')

const AdministrateurController = () =>
  import('#controllers/super_admin/administrateurs_controller')

const DashboardController = () =>
  import('#controllers/super_admin/dashboard_controller')


/*
|--------------------------------------------------------------------------
| PAGE D'ACCUEIL / CONNEXION
|--------------------------------------------------------------------------
*/

router
  .get('/', ({ view }) => {
    return view.render('pages/auth/login/login')
  })
  .as('home')


/*
|--------------------------------------------------------------------------
| AUTHENTIFICATION GOOGLE
|--------------------------------------------------------------------------
*/

router
  .group(() => {

    router
      .get(
        '/google/redirect',
        [GoogleAuthController, 'redirect']
      )
      .as('google.redirect')

    router
      .get(
        '/google/callback',
        [GoogleAuthController, 'callback']
      )
      .as('google.callback')

  })
  .use(middleware.guest())


/*
|--------------------------------------------------------------------------
| MOT DE PASSE OUBLIÉ
|--------------------------------------------------------------------------
*/

router
  .group(() => {

    router
      .get(
        '/password/reset',
        [ForgotPasswordsController, 'showStep1']
      )
      .as('password.reset.step1')

    router
      .post(
        '/password/reset',
        [ForgotPasswordsController, 'processStep1']
      )
      .as('password.reset.step1.submit')

    router
      .get(
        '/password/reset/verify',
        [ForgotPasswordsController, 'showStep2']
      )
      .as('password.reset.step2')

    router
      .post(
        '/password/reset/verify',
        [ForgotPasswordsController, 'processStep2']
      )
      .as('password.reset.step2.submit')

    router
      .get(
        '/password/reset/new',
        [ForgotPasswordsController, 'showStep3']
      )
      .as('password.reset.step3')

    router
      .post(
        '/password/reset/new',
        [ForgotPasswordsController, 'processStep3']
      )
      .as('password.reset.step3.submit')

    router
      .get(
        '/password/reset/success',
        [ForgotPasswordsController, 'showSuccess']
      )
      .as('password.reset.success')

  })
  .use(middleware.guest())


/*
|--------------------------------------------------------------------------
| API AUTH - PUBLIC
|--------------------------------------------------------------------------
*/

router
  .group(() => {

    router
      .post(
        '/register',
        [AuthController, 'register']
      )
      .as('api.auth.register')

    router
      .post(
        '/login',
        [AuthController, 'login']
      )
      .as('api.auth.login')

    router
      .get(
        '/verify-email/:token',
        [AuthController, 'verifyEmail']
      )
      .as('api.auth.verifyEmail')

    router
      .post(
        '/forgot-password',
        [AuthController, 'forgotPassword']
      )
      .as('api.auth.forgotPassword')

    router
      .post(
        '/resend-reset-code',
        [AuthController, 'resendResetCode']
      )
      .as('api.auth.resendResetCode')

    router
      .post(
        '/verify-reset-code',
        [AuthController, 'verifyResetCode']
      )
      .as('api.auth.verifyResetCode')

    router
      .post(
        '/reset-password',
        [AuthController, 'resetPassword']
      )
      .as('api.auth.resetPassword')

  })
  .prefix('/api/auth')
  .use(middleware.guest())


/*
|--------------------------------------------------------------------------
| API AUTH - PROTECTED
|--------------------------------------------------------------------------
*/

router
  .group(() => {

    router
      .get(
        '/me',
        [AuthController, 'me']
      )
      .as('api.auth.me')

    router
      .post(
        '/logout',
        [AuthController, 'logout']
      )
      .as('api.auth.logout')

    router
      .patch(
        '/switch-school',
        [AuthController, 'switchSchool']
      )
      .as('api.auth.switchSchool')

    router
      .patch(
        '/change-password',
        [AuthController, 'changePassword']
      )
      .as('api.auth.changePassword')

  })
  .prefix('/api/auth')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )


/*
|--------------------------------------------------------------------------
| PAGE DE CONNEXION
|--------------------------------------------------------------------------
|
| /login redirige vers la page d'accueil.
|
|--------------------------------------------------------------------------
*/

router
  .get(
    '/login',
    ({ response }) => {
      return response.redirect('/')
    }
  )
  .as('login')


/*
|--------------------------------------------------------------------------
| VÉRIFICATION E-MAIL
|--------------------------------------------------------------------------
|
| Le mail envoyé contient :
|
| /verify-email/:token
|
| Cette route affiche la page de vérification.
| La page appellera ensuite :
|
| GET /api/auth/verify-email/:token
|
|--------------------------------------------------------------------------
*/

router
  .get(
    '/verify-email/:token',
    async ({ view, params }) => {

      return view.render(
        'pages/auth/verify_email',
        {
          token: params.token,
        }
      )

    }
  )
  .as('verify-email')


/*
|--------------------------------------------------------------------------
| PAGES SUPER ADMIN
|--------------------------------------------------------------------------
|
| IMPORTANT :
|
| Ces routes servent uniquement les vues Edge.
|
| Elles ne doivent PAS utiliser ici :
|
| middleware.auth({ guards: ['web'] })
|
| car la connexion actuelle du Super Admin utilise un access token
| API stocké côté navigateur.
|
| La sécurité des données est assurée par les routes :
|
| /api/super-admin/*
|
| protégées par :
|
| 1. auth(api)
| 2. superAdmin
|
|--------------------------------------------------------------------------
*/

router
  .group(() => {

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/dashboard',
        ({ view }) => {
          return view.render(
            'pages/super-admin/dashboard'
          )
        }
      )
      .as('super-admin.dashboard')


    /*
    |--------------------------------------------------------------------------
    | ÉCOLES
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/ecoles',
        ({ view }) => {
          return view.render(
            'pages/super-admin/ecoles'
          )
        }
      )
      .as('super-admin.ecoles')


    router
      .get(
        '/ecoles/create',
        ({ view }) => {
          return view.render(
            'pages/super-admin/ecoles/create'
          )
        }
      )
      .as('super-admin.ecoles.create')


    router
      .get(
        '/ecoles/:id/edit',
        ({ view, params }) => {

          return view.render(
            'pages/super-admin/ecoles/edit',
            {
              id: params.id,
            }
          )

        }
      )
      .as('super-admin.ecoles.edit')


    router
      .get(
        '/ecoles/:id',
        ({ view, params }) => {

          return view.render(
            'pages/super-admin/ecoles/show',
            {
              id: params.id,
            }
          )

        }
      )
      .as('super-admin.ecoles.show')


    router
  .get(
    '/profil',
    ({ view }) =>
      view.render(
        'pages/super-admin/profil'
      )
  )
  .as('super-admin.profil')


    /*
    |--------------------------------------------------------------------------
    | UTILISATEURS
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/utilisateurs',
        ({ view }) => {

          return view.render(
            'pages/super-admin/utilisateurs'
          )

        }
      )
      .as('super-admin.utilisateurs')


    router
      .get(
        '/utilisateurs/create',
        ({ view }) => {

          return view.render(
            'pages/super-admin/utilisateurs/create'
          )

        }
      )
      .as('super-admin.utilisateurs.create')


    router
      .get(
        '/utilisateurs/:id/edit',
        ({ view, params }) => {

          return view.render(
            'pages/super-admin/utilisateurs/edit',
            {
              id: params.id,
            }
          )

        }
      )
      .as('super-admin.utilisateurs.edit')


    router
      .get(
        '/utilisateurs/:id',
        ({ view, params }) => {

          return view.render(
            'pages/super-admin/utilisateurs/show',
            {
              id: params.id,
            }
          )

        }
      )
      .as('super-admin.utilisateurs.show')


    /*
    |--------------------------------------------------------------------------
    | STATISTIQUES
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/statistiques',
        ({ view }) => {

          return view.render(
            'pages/super-admin/statistiques'
          )

        }
      )
      .as('super-admin.statistiques')


    /*
    |--------------------------------------------------------------------------
    | RAPPORTS
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/rapports',
        ({ view }) => {

          return view.render(
            'pages/super-admin/rapports'
          )

        }
      )
      .as('super-admin.rapports')

  })
  .prefix('/super-admin')


/*
|--------------------------------------------------------------------------
| API SUPER ADMIN
|--------------------------------------------------------------------------
|
| Toutes les API Super Admin utilisent :
|
|   auth(api)
|   +
|   superAdmin
|
| Exemple :
|
| GET /api/super-admin/statistiques
| Authorization: Bearer <token>
|
|--------------------------------------------------------------------------
*/

router
  .group(() => {

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/dashboard',
        [DashboardController, 'index']
      )
      .as('dashboard.index')


    router
      .get(
        '/dashboard/statistics',
        [DashboardController, 'statistics']
      )
      .as('dashboard.statistics')


    router
      .get(
        '/dashboard/schools',
        [DashboardController, 'schools']
      )
      .as('dashboard.schools')


    router
      .get(
        '/dashboard/users',
        [DashboardController, 'users']
      )
      .as('dashboard.users')


    router
      .get(
        '/dashboard/recent-schools',
        [DashboardController, 'recentSchools']
      )
      .as('dashboard.recentSchools')


    router
      .get(
        '/dashboard/recent-administrators',
        [DashboardController, 'recentAdministrators']
      )
      .as('dashboard.recentAdministrators')


    router
      .get(
        '/dashboard/top-schools',
        [DashboardController, 'topSchools']
      )
      .as('dashboard.topSchools')


    router
      .get(
        '/dashboard/schools-statistics',
        [DashboardController, 'schoolsStatistics']
      )
      .as('dashboard.schoolsStatistics')


    router
      .get(
        '/dashboard/activities',
        [DashboardController, 'activities']
      )
      .as('dashboard.activities')


    router
      .get(
        '/dashboard/monthly-schools',
        [DashboardController, 'monthlySchools']
      )
      .as('dashboard.monthlySchools')


    router
      .get(
        '/dashboard/monthly-users',
        [DashboardController, 'monthlyUsers']
      )
      .as('dashboard.monthlyUsers')


    router
      .get(
        '/dashboard/system-health',
        [DashboardController, 'systemHealth']
      )
      .as('dashboard.systemHealth')



    /*
    |--------------------------------------------------------------------------
    | ÉCOLES
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/ecoles',
        [EcoleController, 'index']
      )
      .as('ecoles.index')


    router
      .post(
        '/ecoles',
        [EcoleController, 'store']
      )
      .as('ecoles.store')


    router
      .get(
        '/ecoles-search',
        [EcoleController, 'search']
      )
      .as('ecoles.search')


    router
      .get(
        '/ecoles/:id/statistics',
        [EcoleController, 'statistics']
      )
      .as('ecoles.statistics')


    router
      .get(
        '/ecoles/:id/can-delete',
        [EcoleController, 'canDelete']
      )
      .as('ecoles.canDelete')


    router
      .get(
        '/ecoles/:id/exists',
        [EcoleController, 'exists']
      )
      .as('ecoles.exists')


    router
      .get(
        '/ecoles/:id',
        [EcoleController, 'show']
      )
      .as('ecoles.show')


    router
      .put(
        '/ecoles/:id',
        [EcoleController, 'update']
      )
      .as('ecoles.update')


    router
      .patch(
        '/ecoles/:id/suspend',
        [EcoleController, 'suspend']
      )
      .as('ecoles.suspend')


    router
      .patch(
        '/ecoles/:id/activate',
        [EcoleController, 'activate']
      )
      .as('ecoles.activate')


    router
      .patch(
        '/ecoles/:id/archive',
        [EcoleController, 'archive']
      )
      .as('ecoles.archive')


    router
      .delete(
        '/ecoles/:id',
        [EcoleController, 'destroy']
      )
      .as('ecoles.destroy')


    /*
    |--------------------------------------------------------------------------
    | ADMINISTRATEURS
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/administrateurs/statistics',
        [AdministrateurController, 'statistics']
      )
      .as('administrateurs.statistics')


    router
      .get(
        '/administrateurs',
        [AdministrateurController, 'index']
      )
      .as('administrateurs.index')


    router
      .post(
        '/administrateurs',
        [AdministrateurController, 'store']
      )
      .as('administrateurs.store')


    router
      .get(
        '/administrateurs/:id/exists',
        [AdministrateurController, 'exists']
      )
      .as('administrateurs.exists')


    router
      .get(
        '/administrateurs/:id/ecoles/:ecoleId',
        [AdministrateurController, 'belongsToSchool']
      )
      .as('administrateurs.belongsToSchool')


    router
      .patch(
        '/administrateurs/:id/active-school',
        [AdministrateurController, 'switchSchool']
      )
      .as('administrateurs.switchSchool')


    router
      .patch(
        '/administrateurs/:id/suspend',
        [AdministrateurController, 'suspend']
      )
      .as('administrateurs.suspend')


    router
      .patch(
        '/administrateurs/:id/activate',
        [AdministrateurController, 'activate']
      )
      .as('administrateurs.activate')


    router
      .delete(
        '/administrateurs/:id/force',
        [AdministrateurController, 'forceDelete']
      )
      .as('administrateurs.forceDelete')


    router
      .get(
        '/administrateurs/:id',
        [AdministrateurController, 'show']
      )
      .as('administrateurs.show')


    router
      .put(
        '/administrateurs/:id',
        [AdministrateurController, 'update']
      )
      .as('administrateurs.update')


    router
      .delete(
        '/administrateurs/:id',
        [AdministrateurController, 'destroy']
      )
      .as('administrateurs.destroy')


    router
      .get(
        '/ecoles/:id/administrateurs',
        [AdministrateurController, 'getBySchool']
      )
      .as('ecoles.administrateurs')


    /*
    |--------------------------------------------------------------------------
    | STATISTIQUES
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/statistiques',
        [StatisticsController, 'index']
      )
      .as('statistics.index')


    router
      .get(
        '/statistiques/overview',
        [StatisticsController, 'overview']
      )
      .as('statistics.overview')


    router
      .get(
        '/statistiques/ecoles',
        [StatisticsController, 'schools']
      )
      .as('statistics.schools')


    router
      .get(
        '/statistiques/utilisateurs',
        [StatisticsController, 'users']
      )
      .as('statistics.users')


    router
      .get(
        '/statistiques/monthly',
        [StatisticsController, 'monthly']
      )
      .as('statistics.monthly')


    router
      .get(
        '/statistiques/activites',
        [StatisticsController, 'activities']
      )
      .as('statistics.activities')


    /*
    |--------------------------------------------------------------------------
    | RAPPORTS
    |--------------------------------------------------------------------------
    */

    router
      .get(
        '/reports',
        [ReportsController, 'index']
      )
      .as('reports.index')


    router
      .post(
        '/reports',
        [ReportsController, 'store']
      )
      .as('reports.store')


    router
      .get(
        '/reports/:type/download',
        [ReportsController, 'download']
      )
      .as('reports.download')

    
    router
  .get(
    '/profile',
    [SuperAdminController, 'profile']
  )
  .as('superAdmin.profile')

router
  .put(
    '/profile',
    [SuperAdminController, 'updateProfile']
  )
  .as('superAdmin.profile.update')

  

  })
  .prefix('/api/super-admin')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
  .use(
    middleware.superAdmin()
  )