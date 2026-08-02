import mail from '@adonisjs/mail/services/main'


export default class ResetPasswordMail {


  async send(user:any, token:string){

    const url = `${process.env.APP_URL}/reset-password/${token}`
    await mail.send((message)=>{
      message
      .to(user.email)
      .from(process.env.MAIL_FROM_ADDRESS!, process.env.MAIL_FROM_NAME!)
      .subject("Réinitialisation de votre mot de passe")
      .html(`
      <div style="
      font-family:Arial;
      padding:20px;
      ">

      <h2>
      Réinitialisation du mot de passe
      </h2>

      <p>
      Bonjour ${user.prenom},
      </p>

      <p>
      Une demande de changement de mot
      de passe a été effectuée.
      </p>

      <a href="${url}"

      style="
      background:#dc2626;
      color:white;
      padding:12px 20px;
      text-decoration:none;
      border-radius:5px;
      ">

      Réinitialiser mon mot de passe

      </a>

      <p>
      Ce lien expire dans 1 heure.
      </p>

      </div>

      `)


    })


  }


}