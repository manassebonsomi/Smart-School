import mail from '@adonisjs/mail/services/main'


export default class VerifyEmailMail {


  async send(user:any, token:string){

    const url =`${process.env.APP_URL}/verify-email/${token}`

    await mail.send((message)=>{
      message
        .to(user.email)
        .from(process.env.MAIL_FROM_ADDRESS!, process.env.MAIL_FROM_NAME!)
        .subject("Vérification de votre compte Smart School")
        .html(`
          <div style="font-family:Arial; padding:20px; background-color:#f9f9f9; border-radius:5px;">
          <h2>
          Bienvenue ${user.prenom}
          </h2>

          <p>
          Merci d'avoir créé votre compte.
          </p>

          <p>
          Cliquez sur le bouton ci-dessous
          pour confirmer votre adresse email.
          </p>

          <a href="${url}"
          style="
          background:#2563eb;
          color:white;
          padding:12px 20px;
          text-decoration:none;
          border-radius:5px;
          ">

          Vérifier mon email

          </a>


          <p>
          Ce lien expire dans 24 heures.
          </p>


          </div>

        `)


    })


  }


}