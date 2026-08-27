import mail from '@adonisjs/mail/services/main'
export default class ResetPasswordMail {
  async send(user: any, token: string) {
    const url = `${process.env.APP_URL ?? ''}/password/reset/new?token=${encodeURIComponent(token)}`
    await mail.send((message) => {
      message
        .to(user.email)
        .subject('Réinitialisation de votre mot de passe Smart School')
        .html(`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px;color:#0f172a"><h2>Réinitialisation du mot de passe</h2><p>Bonjour ${user.prenom ?? ''},</p><p>Une demande de réinitialisation de votre mot de passe Smart School a été effectuée.</p><p><a href="${url}" style="display:inline-block;background:#0284c7;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px">Réinitialiser mon mot de passe</a></p><p>Ce lien expire dans 1 heure.</p></div>`)
    })
  }
  async sendOtp(user: any, code: string) {
    await mail.send((message) => {
      message
        .to(user.email)
        .subject('Code de récupération Smart School')
        .html(`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px;color:#0f172a"><h2>Code de récupération</h2><p>Bonjour ${user.prenom ?? ''},</p><p>Voici votre code de vérification Smart School :</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#0284c7">${code}</p><p>Ce code expire dans 10 minutes.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p></div>`)
    })
  }
}
