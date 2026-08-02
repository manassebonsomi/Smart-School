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
   * POST /register
   * ==========================================================================
   */
  async register({ request, response }: HttpContext) {

    try {
      //const payload = request.all()
      const payload = await request.validateUsing(registerValidator)
      const result = await this.authService.register(payload)

      return response.created(result)

    } catch(error:any){

      return response.badRequest({
        success:false,
        message:error.message
      })
    }

  }

  /**
   * ==========================================================================
   * CONNEXION
   * POST /login
   * ==========================================================================
   */
  async login({ request, response }: HttpContext) {
    
    try {

     // const payload = request.all()
      const payload = await request.validateUsing(loginValidator)
      const result = await this.authService.login(payload)
      return response.ok(result)

    } catch(error:any){

      return response.unauthorized({
        success:false,
        message:error.message
      })

    }

  }

  /**
   * ==========================================================================
   * DECONNEXION
   * POST /logout
   * ==========================================================================
   */
  /* async logout({ auth, response, request }: HttpContext) {

    try {

      const user = await auth.authenticate()
      const token = request.header('x-access-token') // Authorization: Bearer TOKEN
      const result = await this.authService.logout(user, Number(token))

      return response.ok(result)

    }
    catch(error:any) {

      return response.unauthorized({
        success:false,
        message:error.message
      })

    }

  } */

    /**
 * ==========================================================================
 * DECONNEXION
 * POST /logout
 * ==========================================================================
 */
async logout({ auth, response }: HttpContext) {

  try {

    const user = await auth.authenticate()
    /**
     * Récupération du token courant
     */
    const token = auth.user?.currentAccessToken

    if (!token) {
      throw new Error("Token d'accès introuvable.")
    }

    const result = await this.authService.logout(user, Number(token.identifier))

    return response.ok(result)


  } catch(error:any) {


    return response.unauthorized({
      success:false,
      message:error.message
    })

  }

}

  /**
   * ==========================================================================
   * PROFIL CONNECTÉ
   * GET /me
   * ==========================================================================
   */
  async me({ auth, response }: HttpContext) {


    try {

      const user = await auth.authenticate()
      const result = await this.authService.me(user)

      return response.ok({
        success:true,
        data:result
      })

    }
    catch(error:any){
      return response.unauthorized({
        success:false,
        message:error.message
      })

    }

  }


  /**
   * ==========================================================================
   * CHANGER D'ECOLE
   * PATCH /switch-school
   * ==========================================================================
   */
  async switchSchool({auth,request,response}:HttpContext){

    try{

      const user = await auth.authenticate()
      const {ecoleId} = request.only(['ecoleId'])
      const result = await this.authService.switchSchool(user, ecoleId)

      return response.ok(result)

    }
    catch(error:any){

      return response.badRequest({
        success:false,
        message:error.message
      })
    }
  }

  /**
   * ==========================================================================
   * VERIFICATION EMAIL
   * GET /verify-email/:token
   * ==========================================================================
   */
  async verifyEmail({params,response}:HttpContext){
    try{
      const result = await this.authService.verifyEmail(params.token)

      return response.ok(result)

    }
    catch(error:any){
      return response.badRequest({
        success:false,
        message:error.message
      })

    }


  }

  /**
   * ==========================================================================
   * MOT DE PASSE OUBLIE
   * POST /forgot-password
   * ==========================================================================
   */
  async forgotPassword({request,response}:HttpContext){

    try{
      //const {email} = request.only(['email'])
      const {email} = await request.validateUsing(forgotPasswordValidator)
      const result = await this.authService.forgotPassword(email)

      return response.ok(result)

    }
    catch(error:any){

      return response.badRequest({
        success:false,
        message:error.message
      })
    }

  }

  /**
   * ==========================================================================
   * RESET PASSWORD
   * POST /reset-password
   * ==========================================================================
   */
  async resetPassword({request,response}:HttpContext){
    try{
      const payload = await request.validateUsing(resetPasswordValidator)
      const result = await this.authService.resetPassword(payload)

      return response.ok(result)

    }
    catch(error:any){

      return response.badRequest({
        success:false,
        message:error.message
      })
    }

  }

  /**
   * ==========================================================================
   * CHANGER MOT DE PASSE
   * PATCH /change-password
   * ==========================================================================
   */
  async changePassword({auth,request,response}:HttpContext){
    try{
      const user = await auth.authenticate()
      const payload = await request.validateUsing(changePasswordValidator)
      const result = await this.authService.changePassword(user, payload)

      return response.ok(result)

    }catch(error:any){
      return response.badRequest({
        success:false,
        message:error.message
      })
    }

  }

}