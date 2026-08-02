import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import GoogleAuthController from '#controllers/google_auths_controller'
const EcoleController = () => import('#controllers/super_admin/ecoles_controller')
const AdministrateurController = () => import('#controllers/super_admin/administrateurs_controller')
const DashboardController = () => import('#controllers/super_admin/dashboard_controller')
const AuthController = () => import('#controllers/auth_controller')

router
  .group(() => {
    router.get('/', [controllers.Session, 'show'])
    router.post('/login', [controllers.Session, 'login'])
    router.get('login/s3', [controllers.Session, 'showStep3'])
    router.post('login/e3', [controllers.Session, 'processStep3'])

    router.get('signup', [controllers.NewAccount, 'show'])
    router.post('signup', [controllers.NewAccount, 'register'])


    router.get('/google/redirect', [GoogleAuthController, 'redirect']).as('google.redirect')
    router.get('/google/callback', [GoogleAuthController, 'callback'])
  }).use(middleware.guest())

  router.group(() => {
    router.get('/password/reset', [controllers.ForgotPasswords, 'showStep1']).as('password.reset.step1')
    router.post('/password/reset', [controllers.ForgotPasswords, 'processStep1'])
    router.get('/password/reset/verify', [controllers.ForgotPasswords, 'showStep2']).as('password.reset.step2')
    router.post('/password/reset/verify', [controllers.ForgotPasswords, 'processStep2'])
    router.get('/password/reset/new', [controllers.ForgotPasswords, 'showStep3']).as('password.reset.step3')
    router.post('/password/reset/new', [controllers.ForgotPasswords, 'processStep3'])
  }).use(middleware.guest())

router
  .group(() => {
    router.get('/profile/edit', [controllers.Profile, 'edit']).as('profile.edit')
    router.get('/profile/:id?', [controllers.Profile, 'show']).as('profile.show')
    router.put('/profile/edit', [controllers.Profile, 'update']).as('profile.update')
    router.post('/profile/privacy', [controllers.Profile, 'togglePrivacy']).as('profile.togglePrivacy')
    router.post('/logout', [controllers.Session, 'logout'])
  }).use(middleware.auth())


/*
|--------------------------------------------------------------------------
| Routes publiques Authentification
|--------------------------------------------------------------------------
*/


router
  .group(() => {


    /**
     * Inscription
     */
    router.post('/register', [AuthController, 'register'])

    /**
     * Connexion
     */
    router.post('/login', [AuthController,'login'])

    /**
     * Vérification email
     */
    router.get('/verify-email/:token', [ AuthController, 'verifyEmail'])

    /**
     * Demande récupération mot de passe
     */
    router.post('/forgot-password', [AuthController, 'forgotPassword'])
    /**
     * Réinitialisation mot de passe
     */
    router.post('/reset-password', [AuthController, 'resetPassword'])

  })
  .prefix('/api/auth')

/*
|--------------------------------------------------------------------------
| Routes protégées Authentification
|--------------------------------------------------------------------------
*/


router
  .group(() => {
    /**
     * Informations utilisateur connecté
     */
    router.get('/me', [AuthController, 'me'])
    /**
     * Déconnexion
     */
    router.post('/logout', [AuthController, 'logout'])
    /**
     * Changer d'école active
     */
    router.patch('/switch-school', [AuthController, 'switchSchool'])
    /**
     * Changer mot de passe
     */
    router.patch('/change-password', [AuthController, 'changePassword'])
}).prefix('/api/auth').use(middleware.auth())

/*
|--------------------------------------------------------------------------
| Routes Super Administrateur
|--------------------------------------------------------------------------
*/

router
  .group(() => {

        /*
    |--------------------------------------------------------------------------
    | Dashboard Super Administrateur
    |--------------------------------------------------------------------------
    */

    router.get('/dashboard', [DashboardController, 'index'])
    router.get('/dashboard/statistics', [DashboardController, 'statistics'])
    router.get('/dashboard/schools', [DashboardController, 'schools'])
    router.get('/dashboard/users', [DashboardController, 'users'])
    router.get('/dashboard/recent-schools', [DashboardController, 'recentSchools'])
    router.get('/dashboard/recent-administrators', [DashboardController, 'recentAdministrators'])
    router.get('/dashboard/top-schools', [DashboardController, 'topSchools'])
    router.get('/dashboard/schools-statistics', [DashboardController, 'schoolsStatistics'])
    router.get('/dashboard/activities', [DashboardController, 'activities'])
    router.get('/dashboard/monthly-schools', [DashboardController, 'monthlySchools'])
    router.get('/dashboard/monthly-users', [DashboardController, 'monthlyUsers'])
    router.get('/dashboard/system-health', [DashboardController, 'systemHealth'])

    /*
    |--------------------------------------------------------------------------
    | Gestion des écoles
    |--------------------------------------------------------------------------
    */
    router.get('/ecoles', [EcoleController, 'index'])
    router.post('/ecoles', [EcoleController, 'store'])
    router.get('/ecoles/:id', [EcoleController, 'show'])
    router.put('/ecoles/:id', [EcoleController, 'update'])
    router.patch('/ecoles/:id/suspend', [EcoleController, 'suspend'])
    router.patch('/ecoles/:id/activate', [EcoleController, 'activate'])
    router.patch('/ecoles/:id/archive', [EcoleController, 'archive'])
    router.delete('/ecoles/:id', [EcoleController, 'destroy'])

    /*
    |--------------------------------------------------------------------------
    | Recherche
    |--------------------------------------------------------------------------
    */
    router.get('/ecoles-search', [EcoleController, 'search'])
    /*
    |--------------------------------------------------------------------------
    | Statistiques école
    |--------------------------------------------------------------------------
    */
    router.get('/ecoles/:id/statistics', [EcoleController, 'statistics'])
    router.get('/ecoles/:id/can-delete', [EcoleController, 'canDelete'])
    router.get('/ecoles/:id/exists', [EcoleController, 'exists'])

        /*
    |--------------------------------------------------------------------------
    | Gestion des administrateurs
    |--------------------------------------------------------------------------
    */

    router.get('/administrateurs', [AdministrateurController, 'index'])
    router.post('/administrateurs', [AdministrateurController, 'store'])  
    router.get('/administrateurs/:id', [AdministrateurController, 'show'])
    router.put('/administrateurs/:id', [AdministrateurController, 'update'])
    router.patch('/administrateurs/:id/suspend', [AdministrateurController, 'suspend'])
    router.patch('/administrateurs/:id/activate', [AdministrateurController,'activate'])
    router.delete('/administrateurs/:id', [AdministrateurController, 'destroy'])
    router.delete('/administrateurs/:id/force', [AdministrateurController, 'forceDelete'])
    router.get('/administrateurs/statistics', [AdministrateurController, 'statistics'])
    router.get('/administrateurs/:id/exists', [AdministrateurController, 'exists'])
    router.get('/ecoles/:id/administrateurs', [AdministrateurController, 'getBySchool'])
    router.patch('/administrateurs/:id/active-school', [AdministrateurController, 'switchSchool'])
    router.get('/administrateurs/:id/ecoles/:ecoleId', [AdministrateurController, 'belongsToSchool'])

  }).prefix('/api/super-admin').use(middleware.auth())
