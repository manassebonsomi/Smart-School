import { BaseMail } from '@adonisjs/mail'

export default class VerifyEmailNotification extends BaseMail {
  subject = 'Code vérification du compte'

  constructor(private user: { email: string, name: string, code: string }) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email)
      .from('appbmm@production.com')
      // Vous pouvez utiliser .html() pour du texte brut ou .htmlView() pour un template Edge
      .html(`
        <h1>Bonjour ${this.user.name}</h1>
        <p>Merci de vous être inscrit ! Ce code expire dans 30 minutes</p>
        <p>Voici votre code pour la confirmation du compte : ${this.user.code}</p>
        `)
      //.htmlView('emails/welcome', { name: this.user.name, code: this.user.code })
  }
}
