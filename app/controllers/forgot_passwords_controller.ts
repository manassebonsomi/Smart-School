import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import AuthService from '#services/auth_service'
import User from '#models/user'

export default class ForgotPasswordController {
  private authService = new AuthService()

  async showStep1({ view }: HttpContext) {
    return view.render('pages/auth/forgotmdp/forgot_password_step_1')
  }

  async processStep1({ request, session, response }: HttpContext) {
  const schema = vine.compile(
    vine.object({
      email: vine.string().trim().email().normalizeEmail(),
    })
  )

  try {
    const { email } = await request.validateUsing(schema)

    // Vérification locale de l'utilisateur
    const utilisateur = await User.findBy('email', email)

    if (!utilisateur) {
      session.flash(
        'errors.email',
        "Aucun compte n'est associé à cette adresse e-mail."
      )

      return response.redirect().back()
    }

    // Le service génère l'OTP et l'envoie par e-mail
    await this.authService.forgotPassword(email)

    // L'e-mail utilisé pour les étapes suivantes
    session.put('reset_email', utilisateur.email)

    // Nettoyage d'une éventuelle ancienne récupération
    session.forget('reset_token')
    session.forget('reset_verified')

    session.flash(
      'success',
      'Un code de vérification à 6 chiffres a été envoyé à votre adresse e-mail.'
    )

    return response.redirect('/password/reset/verify')
  } catch (error: any) {
    session.flash(
      'errors.email',
      error?.message || 'Impossible de traiter votre demande.'
    )

    return response.redirect().back()
  }
}

  async showStep2({ view, session, response }: HttpContext) {
    const email = session.get('reset_email')

    if (!email) {
      return response.redirect('/password/reset')
    }

    return view.render('pages/auth/forgotmdp/forgot_password_step_2', {
      email,
    })
  }

  async processStep2({ request, session, response }: HttpContext) {
  const email = session.get('reset_email')

  if (!email) {
    session.flash(
      'errors.code',
      'Votre session de récupération a expiré. Veuillez recommencer.'
    )

    return response.redirect('/password/reset')
  }

  const code = String(request.input('code', '')).trim()

  // Vérification simple avant Vine
  if (!/^\d{6}$/.test(code)) {
    session.flash(
      'errors.code',
      'Veuillez saisir les 6 chiffres du code reçu par e-mail.'
    )

    return response.redirect().back()
  }

  try {
    const result = await this.authService.verifyResetCode(
      String(email),
      code
    )

    session.put('reset_token', result.resetToken)
    session.put('reset_verified', true)

    session.flash(
      'success',
      'Code vérifié avec succès. Vous pouvez maintenant créer un nouveau mot de passe.'
    )

    return response.redirect('/password/reset/new')
  } catch (error: any) {
    session.flash(
      'errors.code',
      error?.message || 'Code de vérification incorrect ou expiré.'
    )

    return response.redirect().back()
  }
}

  async showStep3({ view, session, response }: HttpContext) {
    const verified = session.get('reset_verified')
    const token = session.get('reset_token')

    if (!verified || !token) {
      return response.redirect('/password/reset')
    }

    return view.render('pages/auth/forgotmdp/forgot_password_step_3')
  }

  async processStep3({ request, session, response }: HttpContext) {
    const verified = session.get('reset_verified')
    const token = session.get('reset_token')

    if (!verified || !token) {
      session.flash(
        'error',
        'Votre session de récupération est invalide ou expirée.'
      )

      return response.redirect('/password/reset')
    }

    const schema = vine.compile(
      vine.object({
        password: vine.string().minLength(8).maxLength(128),
        password_confirmation: vine.string().minLength(8).maxLength(128),
      })
    )

    try {
      const payload = await request.validateUsing(schema)

      if (payload.password !== payload.password_confirmation) {
        session.flash(
          'errors.password_confirmation',
          'Les deux mots de passe ne correspondent pas.'
        )

        return response.redirect().back()
      }

      await this.authService.resetPassword({
        token: String(token),
        password: payload.password,
      })

      session.forget('reset_email')
      session.forget('reset_token')
      session.forget('reset_verified')

      session.flash(
        'success',
        'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.'
      )

      return response.redirect('/password/reset/success')
    } catch (error: any) {
      session.flash(
        'error',
        error?.message || 'Une erreur est survenue lors de la réinitialisation.'
      )

      return response.redirect().back()
    }
  }

  async showSuccess({ view }: HttpContext) {
    return view.render('pages/auth/forgotmdp/password_reset_success')
  }
}