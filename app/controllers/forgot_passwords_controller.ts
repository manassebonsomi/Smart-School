import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'

export default class ForgotPasswordController {

  async showStep1({ view }: HttpContext) {
    return view.render('pages/auth/forgotmdp/forgot_password_step_1')
  }

  async processStep1({ request, session, response }: HttpContext) {
    const step1Schema = vine.compile(
      vine.object({
        email: vine.string().email().normalizeEmail()
      })
    )

    let payload: { email: string; }
    try {
      payload = await request.validateUsing(step1Schema)
    } catch (error) {
      session.flash('error.email', 'Veuillez entrer un email correct.')
      return response.redirect().back()
    }

    // Vérifier si l'utilisateur existe
    const utilisateur = await User.findBy('email', payload.email)

    if (!utilisateur) {
      session.flash('errors.email', "Aucun compte n'est associé à cette adresse email.")
      return response.redirect().back()
    }

    // Génération d'un code OTP numérique à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Stockage en session
    session.put('reset_email', utilisateur.email)
    session.put('reset_otp', otpCode)
    session.put('reset_verified', false)

    // Envoi de l'email
    await mail.send((message) => {
      message
        .to(utilisateur.email)
        .subject('Réinitialisation de votre mot de passe X Clone')
        .html(`
          <h1>Bonjour ${utilisateur.name}</h1>,
          <p> Code de reunitialisation !</p>
          <p>Voici votre code pour la reunitialisation de votre compte : ${otpCode}</p>
          `)
    })

    return response.redirect().toRoute('password.reset.step2')
  }

  async showStep2({ view, session, response }: HttpContext) {
    if (!session.has('reset_email')) {
      return response.redirect().toRoute('password.reset.step1')
    }
    const email = session.get('reset_email')
    return view.render('pages/auth/forgotmdp/forgot_password_step_2', { email })
  }

  async processStep2({ request, session, response }: HttpContext) {
    const step2Schema = vine.compile(
      vine.object({
        code: vine.string().fixedLength(6)
      })
    )

    let payload: { code: string; }
    try {
      payload = await request.validateUsing(step2Schema)
    } catch (error) {
      session.flash('errors.code', 'Le code de vérification est incorrect.')
      return response.redirect().back()
    }

    const expectedCode = session.get('reset_otp')

    if (payload.code !== expectedCode) {
      session.flash('errors.code', 'Le code de vérification est incorrect.')
      return response.redirect().back()
    }

    // Code valide : on autorise la modification du mot de passe
    session.put('reset_verified', true)
    return response.redirect().toRoute('password.reset.step3')
  }

  async showStep3({ view, session, response }: HttpContext) {
    if (!session.get('reset_verified')) {
      return response.redirect().toRoute('password.reset.step1')
    }
    return view.render('pages/auth/forgotmdp/forgot_password_step_3')
  }

  async processStep3({ request, session, response }: HttpContext) {
    if (!session.get('reset_verified') || !session.has('reset_email')) {
      return response.redirect().toRoute('password.reset.step1')
    }

    const step3Schema = vine.compile(
      vine.object({
        password: vine.string().minLength(8)
      })
    )

    let payload: { password: string; }

    try {
      payload = await request.validateUsing(step3Schema)
    } catch (error) {
      session.flash('error.password', 'Le mot de passe doit contenir au moins 8 caractères.')
      return response.redirect().back()
      }

    const email = session.get('reset_email')

    try {
      const utilisateur = await User.findByOrFail('email', email)

      // Mise à jour du mot de passe (le hook @beforeSave va le hacher automatiquement)
      utilisateur.password = payload.password
      await utilisateur.save()

      // Nettoyage de la session
      session.forget('reset_email')
      session.forget('reset_otp')
      session.forget('reset_verified')

      session.flash('success', 'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.')
      return response.redirect('/login/s1')

    } catch (error) {
      session.flash('error', 'Une erreur est survenue lors de la mise à jour.')
      return response.redirect().back()
    }
  }
}
