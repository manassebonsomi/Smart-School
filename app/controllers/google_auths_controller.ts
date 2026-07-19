import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class GoogleAuthController {
  // Rediriger vers Google
  async redirect({ ally }: HttpContext) {
    return ally.use('google').redirect()
  }

  // Gérer le retour de Google
  async callback({ ally, auth, response }: HttpContext) {
    const googleUser = ally.use('google')

    if (googleUser.accessDenied()) {
      return 'Accès refusé'
    }

    const userDetails = await googleUser.user()

    // On cherche l'utilisateur par son Google ID ou son Email
    const user = await User.firstOrCreate(
      { email: userDetails.email },
      {
        name: userDetails.name,
        pseudo: userDetails.email.split('@')[0],
        googleId: userDetails.id,
        password: Math.random().toString(36).slice(-10), 
      }
    )

    // Connexion de l'utilisateur
    await auth.use('web').login(user)
    return response.redirect('/home')
  }
}