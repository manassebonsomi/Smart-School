import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import GoogleAuthController from '#controllers/google_auths_controller'

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
