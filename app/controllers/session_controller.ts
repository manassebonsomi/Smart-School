import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

type ValidationErrorItem = {
  field: string
  message: string
}

function normalizeErrors(error: unknown): ValidationErrorItem[] {
  const maybeMessages = (error as { messages?: unknown })?.messages
  if (Array.isArray(maybeMessages)) {
    return maybeMessages as ValidationErrorItem[]
  }
  const nested = (maybeMessages as { errors?: unknown })?.errors
  if (Array.isArray(nested)) {
    return nested as ValidationErrorItem[]
  }
  return []
}

function mapErrors(errors: ValidationErrorItem[]) {
  return errors.reduce<Record<string, string>>((acc, item) => {
    acc[item.field] = item.message
    return acc
  }, {})
}

export default class SessionController {

  async show({ view }: HttpContext) {
    return view.render('pages/auth/login/login')
  }

  async login({ request, session, response, view, auth }: HttpContext) {
    // Validateur simple pour s'assurer que le champ n'est pas vide
    const schema = vine.compile(
      vine.object({
        email: vine.string().trim().email().normalizeEmail(),
        password: vine.string().minLength(8)
      })
    )

     let payload: { email: string; password: string }

     try {
      payload = await request.validateUsing(schema)
    } catch (error) {
      const errors = normalizeErrors(error)
      return response.status(422).send(
        await view.render('pages/auth/login/login', {
          errors,
          errorMap: mapErrors(errors),
          values: request.only(['email', 'password']),
        })
      )
     }

     /* const user = await User.verifyCredentials(payload.email, payload.password)

     if (!user) {
      session.flash('erreur', "Désolé, Informations erronées.")
      return response.redirect().back()
    }
      */

    try {
      const user = await User.verifyCredentials(payload.email, payload.password)
      
      if (!user) {
        const message = 'Email ou mot de passe faux'
        return response.status(422).send(
          await view.render('pages/auth/login/login', {
            errors: [{ field: 'email', message }],
            errorMap: { email: message, password: message },
            values: request.only(['email']),
          })
        )
      }
  
      await auth.use('web').login(user)
      return response.redirect('/home')
  
      } 
      catch (error) {
        const message = 'Email ou mot de passe incorrect'
        return response.status(422).send(
          await view.render('pages/auth/login/login', {
            errors: [{ field: 'email', message }],
            errorMap: { email: message, password: message },
            values: request.only(['email']),
          })
        )
      }  

     
    
  }

  async showStep2({ view, session, response }: HttpContext) {
    if (!session.has('login_identifiant')) {
      return response.redirect('/login/s1')
    }

    const identifiant = session.get('login_identifiant')
    return view.render('pages/auth/login/login_step_2', { identifiant })
  }

  async processStep2({ request, session, response, auth }: HttpContext) {
    // Sécurité au cas où l'utilisateur accède directement à la route post
    if (!session.has('login_identifiant')) {
      return response.redirect('/login/s1')
    }

    const step2Schema = vine.compile(
      vine.object({
        password: vine.string().minLength(8)
      })
    )

    let payload: { password: string; }

      try {
        payload = await request.validateUsing(step2Schema)
      } catch (error) {
          session.flash('error.password', 'Le mot de passe doit contenir au moins 8 caractères.')
          return response.redirect().back()
        }

    const identifiant = session.get('login_identifiant')

    try {
      // On récupère à nouveau l'utilisateur
      const utilisateur = await User.query()
        .where('email', identifiant)
        .firstOrFail()

      // Vérification du mot de passe haché
      const isValid = await hash.verify(utilisateur.password, payload.password)

      if (!isValid) {
        session.flash('errors.password', 'Mot de passe incorrect.')
        return response.redirect().back()
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

      utilisateur.twoFactorCode = otpCode
      utilisateur.twoFactorExpiresAt = DateTime.now().plus({ minutes: 10 })
      await utilisateur.save()

      session.put('login', utilisateur.email)
      session.put('login_code', otpCode)


    await auth.use('web').login(utilisateur)
    return response.redirect('/home')

    } catch (error) {
      session.flash('error', 'Une erreur inattendue est survenue.')
      return response.redirect().back()
    }
  }

  async showStep3({ view, session, response }: HttpContext) {
    if (!session.has('login')) {
      return response.redirect('/login/s1')
    }

    const email = session.get('login')

    return view.render('pages/auth/login/login_step_3', { email })
  }

  async processStep3({ request, session, response, auth }: HttpContext) {
    const step3Schema = vine.compile(
      vine.object({
        code: vine.string().fixedLength(6)
      })
    )

    let payload: { code: string; }

    try {
      payload = await request.validateUsing(step3Schema)
    } catch (error) {
      session.flash('errors.code', 'Le code de vérification est incorrect.')
      return response.redirect().back()
    }

    const info = session.get('login')
    // const code = session.get('login_code')

    const utilisateur = await User.query()
        .where('email', info)
        .firstOrFail()

    // Vérification de la validité du code
    const isCodeValid = utilisateur.twoFactorCode === payload.code
    const isNotExpired = utilisateur.twoFactorExpiresAt && utilisateur.twoFactorExpiresAt > DateTime.now()

    if (isCodeValid && isNotExpired) {
      // Nettoyage du code et connexion
      utilisateur.twoFactorCode = null
      utilisateur.twoFactorExpiresAt = null
      await utilisateur.save()

        // Nettoyage
      session.forget('login')
      session.forget('login_code')

      await auth.use('web').login(utilisateur)
      return response.redirect('/home')
    }

    session.flash('errors.code', 'Le code de vérification est incorrect.')
    return response.redirect().back()


  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }
}
