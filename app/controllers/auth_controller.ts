import type { HttpContext } from '@adonisjs/core/http'

import AuthService from '#services/auth_service'

import { registerValidator } from '#validators/auth/register'
import { loginValidator } from '#validators/auth/login'
import { forgotPasswordValidator } from '#validators/auth/forgot_password'
import { resetPasswordValidator } from '#validators/auth/reset_password'
import { changePasswordValidator } from '#validators/auth/change_password'

export default class AuthController {

  private authService = new AuthService()

  /**
   * ==========================================================================
   * INSCRIPTION
   * POST /api/auth/register
   * ==========================================================================
   */
  async register({ request, response }: HttpContext) {

    try {

      const payload = await request.validateUsing(registerValidator)

      const result = await this.authService.register(payload)

      return response.created(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * CONNEXION
   * POST /api/auth/login
   * ==========================================================================
   */
  async login({ request, response }: HttpContext) {

    try {

      const payload = await request.validateUsing(loginValidator)

      const result = await this.authService.login(payload)

      return response.ok(result)

    } catch (error: any) {

      return response.unauthorized({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * DECONNEXION
   * POST /api/auth/logout
   * ==========================================================================
   */
  async logout({ auth, response }: HttpContext) {

    try {

      await auth.authenticateUsing(['api'])

      await auth.use('api').invalidateToken()

      return response.ok({
        success: true,
        message: 'Déconnexion effectuée avec succès.',
      })

    } catch (error: any) {

      return response.unauthorized({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * UTILISATEUR CONNECTÉ
   * GET /api/auth/me
   * ==========================================================================
   */
  async me({ auth, response }: HttpContext) {

    try {

      const user = await auth.authenticateUsing(['api'])

      const result = await this.authService.me(user)

      return response.ok({
        success: true,
        data: result,
      })

    } catch (error: any) {

      return response.unauthorized({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * CHANGER D'ÉCOLE
   * PATCH /api/auth/switch-school
   * ==========================================================================
   */
  async switchSchool({ auth, request, response }: HttpContext) {

    try {

      const user = await auth.authenticateUsing(['api'])

      const ecoleId = Number(
        request.input('ecoleId')
      )

      if (!ecoleId || Number.isNaN(ecoleId)) {

        return response.badRequest({
          success: false,
          message: 'Identifiant de l’école invalide.',
        })

      }

      const result = await this.authService.switchSchool(
        user,
        ecoleId
      )

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * VERIFICATION EMAIL
   * GET /api/auth/verify-email/:token
   * ==========================================================================
   */
  async verifyEmail({ params, response }: HttpContext) {

    try {

      const result = await this.authService.verifyEmail(
        params.token
      )

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * MOT DE PASSE OUBLIÉ
   * POST /api/auth/forgot-password
   * ==========================================================================
   */
  async forgotPassword({ request, response }: HttpContext) {

    try {

      const { email } = await request.validateUsing(
        forgotPasswordValidator
      )

      const result = await this.authService.forgotPassword(email)

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * RENVOYER LE CODE DE RÉCUPÉRATION
   * POST /api/auth/resend-reset-code
   * ==========================================================================
   */
  async resendResetCode({ request, response }: HttpContext) {

    try {

      const { email } = await request.validateUsing(
        forgotPasswordValidator
      )

      const result = await this.authService.resendResetCode(email)

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * VÉRIFIER LE CODE DE RÉCUPÉRATION
   * POST /api/auth/verify-reset-code
   * ==========================================================================
   */
  async verifyResetCode({ request, response }: HttpContext) {

    try {

      const email = String(
        request.input('email', '')
      ).trim()

      const code = String(
        request.input('code', '')
      ).trim()

      if (!email) {

        return response.badRequest({
          success: false,
          message: 'Adresse email obligatoire.',
        })

      }

      if (!/^\d{6}$/.test(code)) {

        return response.badRequest({
          success: false,
          message: 'Le code de vérification doit contenir 6 chiffres.',
        })

      }

      const result = await this.authService.verifyResetCode(
        email,
        code
      )

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * RÉINITIALISER LE MOT DE PASSE
   * POST /api/auth/reset-password
   * ==========================================================================
   */
  async resetPassword({ request, response }: HttpContext) {

    try {

      const payload = await request.validateUsing(
        resetPasswordValidator
      )

      const result = await this.authService.resetPassword(
        payload
      )

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

  /**
   * ==========================================================================
   * CHANGER LE MOT DE PASSE
   * PATCH /api/auth/change-password
   * ==========================================================================
   */
  async changePassword({ auth, request, response }: HttpContext) {

    try {

      const user = await auth.authenticateUsing(['api'])

      const payload = await request.validateUsing(
        changePasswordValidator
      )

      const result = await this.authService.changePassword(
        user,
        payload
      )

      return response.ok(result)

    } catch (error: any) {

      return response.badRequest({
        success: false,
        message: error.message,
      })

    }

  }

}