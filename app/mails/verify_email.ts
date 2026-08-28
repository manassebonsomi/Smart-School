import mail from '@adonisjs/mail/services/main'


export default class VerifyEmailMail {

  async send(
    user: any,
    token: string
  ) {

    const baseUrl =
      process.env.APP_URL ||
      'http://localhost:3333'


    const url =
      `${baseUrl.replace(/\/$/, '')}/verify-email/${encodeURIComponent(token)}`


    await mail.send(
      (message) => {

        message
          .to(user.email)

          .from(
            process.env.MAIL_FROM_ADDRESS!,
            process.env.MAIL_FROM_NAME!
          )

          .subject(
            'Vérification de votre compte Smart School'
          )

          .html(`

            <div
              style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                background: #f8fafc;
                color: #0f172a;
              "
            >

              <div
                style="
                  background: #ffffff;
                  border-radius: 16px;
                  padding: 30px;
                  border: 1px solid #e2e8f0;
                "
              >

                <h2
                  style="
                    margin: 0 0 20px;
                    color: #0f172a;
                  "
                >
                  Bienvenue ${user.prenom || ''} !
                </h2>


                <p
                  style="
                    color: #475569;
                    line-height: 1.7;
                  "
                >
                  Merci d'avoir créé votre compte
                  sur <strong>Smart School</strong>.
                </p>


                <p
                  style="
                    color: #475569;
                    line-height: 1.7;
                  "
                >
                  Pour activer votre compte,
                  veuillez confirmer votre adresse
                  e-mail en cliquant sur le bouton
                  ci-dessous.
                </p>


                <div
                  style="
                    margin: 30px 0;
                    text-align: center;
                  "
                >

                  <a
                    href="${url}"
                    style="
                      display: inline-block;
                      background: #0284c7;
                      color: #ffffff;
                      padding: 14px 24px;
                      text-decoration: none;
                      border-radius: 10px;
                      font-weight: bold;
                    "
                  >
                    Vérifier mon adresse e-mail
                  </a>

                </div>


                <p
                  style="
                    font-size: 13px;
                    color: #64748b;
                    line-height: 1.6;
                  "
                >
                  Ce lien est valable pendant
                  <strong>24 heures</strong>.
                </p>


                <p
                  style="
                    font-size: 13px;
                    color: #94a3b8;
                    line-height: 1.6;
                  "
                >
                  Si vous n'êtes pas à l'origine
                  de cette demande, vous pouvez
                  ignorer cet e-mail.
                </p>

              </div>


              <p
                style="
                  margin-top: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #94a3b8;
                "
              >
                © 2026 Smart School.
                Tous droits réservés.
              </p>

            </div>

          `)

      }
    )

  }

}