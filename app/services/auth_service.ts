import crypto from 'node:crypto'

import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

import User from '#models/user'
import EcoleUser from '#models/ecole_user'
import UserContext from '#models/user_context'

import VerifyEmailMail from '#mails/verify_email'
import ResetPasswordMail from '#mails/reset_password'

import { SystemRole } from '../enums/system_role.ts'


export default class AuthService {

  private verifyEmailMail = new VerifyEmailMail()

  private resetPasswordMail = new ResetPasswordMail()


  /**
   * ==========================================================================
   * INSCRIPTION
   * ==========================================================================
   *
   * Cette méthode reste disponible pour le moment.
   * Dans l'architecture finale, les comptes seront normalement créés par :
   *
   * - le Super Administrateur pour les administrateurs d'école ;
   * - l'administrateur d'école pour les autres utilisateurs.
   */
  async register(payload: any) {

    const trx = await db.transaction()

    try {

      const email = String(payload.email)
        .trim()
        .toLowerCase()

      const telephone = payload.telephone
        ? String(payload.telephone).trim()
        : null


      /**
       * Vérification email
       */
      const emailExists = await User
        .query({ client: trx })
        .where('email', email)
        .first()

      if (emailExists) {
        throw new Error(
          'Cette adresse email est déjà utilisée.'
        )
      }


      /**
       * Vérification téléphone
       */
      if (telephone) {

        const telephoneExists = await User
          .query({ client: trx })
          .where('telephone', telephone)
          .first()

        if (telephoneExists) {
          throw new Error(
            'Ce numéro de téléphone est déjà utilisé.'
          )
        }

      }


      /**
       * Génération du token de vérification
       */
      const verificationToken =
        crypto.randomBytes(32).toString('hex')


      /**
       * Création utilisateur
       */
      const user = new User()

      user.useTransaction(trx)

      user.merge({

        nom: payload.nom,

        postnom: payload.postnom ?? null,

        prenom: payload.prenom,

        pseudo: payload.pseudo ?? null,

        email,

        telephone,

        sexe: payload.sexe ?? null,

        password: payload.password,

        statut: 'EN ATTENTE',

        systemRole: SystemRole.USER,

        isVerified: false,

        token_verification:
          verificationToken,

        tokenVerificationExpiresAt:
          DateTime.now().plus({
            hours: 24,
          }),

      })


      await user.save()

      await trx.commit()


      /**
       * Envoi email après validation de la transaction
       */
      await this.verifyEmailMail.send(
        user,
        verificationToken
      )


      return {

        success: true,

        message:
          'Compte créé avec succès. Veuillez vérifier votre adresse email.',

        user:
          this.serializeUser(user),

      }


    } catch (error) {

      await trx.rollback()

      throw error

    }

  }


  /**
   * ==========================================================================
   * CONNEXION
   * ==========================================================================
   */
  async login(payload: any) {

    const email = String(payload.email)
      .trim()
      .toLowerCase()


    /**
     * AuthFinder protège la vérification des identifiants
     * contre les attaques de type timing.
     */
    let user: User

    try {

      user = await User.verifyCredentials(
        email,
        payload.password
      )

    } catch {

      throw new Error(
        'Adresse e-mail ou mot de passe incorrect.'
      )

    }


    /**
     * Compte actif uniquement
     */
    if (user.statut !== 'ACTIF') {

      if (user.statut === 'EN ATTENTE') {

        throw new Error(
          'Votre compte est en attente de validation. Veuillez vérifier votre adresse email.'
        )

      }

      if (user.statut === 'BLOQUE') {

        throw new Error(
          'Votre compte est bloqué.'
        )

      }

      if (user.statut === 'SUPPRIME') {

        throw new Error(
          'Votre compte a été supprimé.'
        )

      }

      throw new Error(
        "Votre compte n'est pas actif."
      )

    }


    /**
     * --------------------------------------------------------------------------
     * SUPER ADMIN
     * --------------------------------------------------------------------------
     *
     * Le Super Admin n'a aucune obligation d'avoir une école.
     */
    if (user.systemRole === SystemRole.SUPER_ADMIN) {

      const token = await User.accessTokens.create(
        user,
        ['*'],
        {
          name: 'Connexion Super Administrateur',
          expiresIn: '30 days',
        }
      )


      user.lastLoginAt = DateTime.now()

      await user.save()


      return {

        success: true,

        message:
          'Connexion réussie.',

        data: {

          token: {

            type: 'bearer',

            value: token.value!.release(),

            expiresAt: token.expiresAt,

          },

          user:
            this.serializeUser(user),

          ecoles: [],

          contexte: null,

          mustChooseSchool: false,

          isSuperAdmin: true,

          redirectTo:
            '/super-admin/dashboard',

        },

      }

    }


    /**
     * --------------------------------------------------------------------------
     * UTILISATEUR STANDARD
     * --------------------------------------------------------------------------
     */
    const ecoles = await EcoleUser
      .query()
      .where('user_id', user.id)
      .where('statut', 'ACTIF')
      .preload('ecole')


    if (ecoles.length === 0) {

      throw new Error(
        "Votre compte n'est associé à aucune école active."
      )

    }


    /**
     * Génération token
     */
    const token = await User.accessTokens.create(
      user,
      ['*'],
      {
        name: 'Connexion Smart School',
        expiresIn: '30 days',
      }
    )


    /**
     * Mise à jour dernière connexion
     */
    user.lastLoginAt = DateTime.now()

    await user.save()


    let contexte = null


    /**
     * Une seule école
     */
    if (ecoles.length === 1) {

      await UserContext
        .query()
        .where('user_id', user.id)
        .update({
          active: false,
        })


      contexte = await UserContext.updateOrCreate(

        {
          userId: user.id,
          ecoleId: ecoles[0].ecoleId,
        },

        {
          active: true,
        }

      )

    }


    return {

      success: true,

      message:
        'Connexion réussie.',

      data: {

        token: {

          type: 'bearer',

          value: token.value!.release(),

          expiresAt: token.expiresAt,

        },

        user:
          this.serializeUser(user),

        ecoles,

        contexte,

        mustChooseSchool:
          ecoles.length > 1,

        isSuperAdmin: false,

        redirectTo:
          ecoles.length > 1
            ? '/choisir-ecole'
            : '/home',

      },

    }

  }


  /**
   * ==========================================================================
   * DÉCONNEXION
   * ==========================================================================
   */
  async logout(
    user: User,
    tokenId: number
  ) {

    await User.accessTokens.delete(
      user,
      tokenId
    )


    return {

      success: true,

      message:
        'Déconnexion effectuée avec succès.',

    }

  }


  /**
   * ==========================================================================
   * UTILISATEUR CONNECTÉ
   * ==========================================================================
   */
  async me(user: User) {

    const ecoles = await EcoleUser
      .query()
      .where('user_id', user.id)
      .where('statut', 'ACTIF')
      .preload('ecole')


    const context = await UserContext
      .query()
      .where('user_id', user.id)
      .where('active', true)
      .preload('ecole')
      .first()


    return {

      user:
        this.serializeUser(user),

      ecoles,

      context,

      isSuperAdmin:
        user.systemRole === SystemRole.SUPER_ADMIN,

    }

  }


  /**
   * ==========================================================================
   * CHANGER D'ÉCOLE
   * ==========================================================================
   */
  async switchSchool(
    user: User,
    ecoleId: number
  ) {

    /**
     * Un Super Admin ne fonctionne pas avec un contexte scolaire.
     */
    if (user.systemRole === SystemRole.SUPER_ADMIN) {

      throw new Error(
        "Le Super Administrateur n'a pas besoin de changer d'école."
      )

    }


    const membership = await EcoleUser
      .query()
      .where('user_id', user.id)
      .where('ecole_id', ecoleId)
      .where('statut', 'ACTIF')
      .preload('ecole')
      .first()


    if (!membership) {

      throw new Error(
        "Vous n'avez pas accès à cette école."
      )

    }


    /**
     * Une seule école peut être active à la fois.
     */
    await UserContext
      .query()
      .where('user_id', user.id)
      .update({
        active: false,
      })


    let context = await UserContext
      .query()
      .where('user_id', user.id)
      .where('ecole_id', ecoleId)
      .first()


    if (context) {

      context.active = true

      await context.save()

    } else {

      context = await UserContext.create({

        userId: user.id,

        ecoleId,

        active: true,

      })

    }


    return {

      success: true,

      message:
        'École active modifiée avec succès.',

      context: {

        id: context.id,

        ecoleId: context.ecoleId,

        active: context.active,

        ecole: membership.ecole,

      },

    }

  }


  /**
   * ==========================================================================
   * MOT DE PASSE OUBLIÉ
   * ==========================================================================
   */
  async forgotPassword(email: string) {

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase()


    const user = await User.findBy(
      'email',
      normalizedEmail
    )


    /**
     * Même réponse si le compte n'existe pas
     * afin de ne pas révéler les comptes présents.
     */
    if (!user) {

      return {

        success: true,

        message:
          'Si cette adresse email existe, un code de récupération a été envoyé.',

      }

    }


    const otp = crypto
      .randomInt(100000, 1000000)
      .toString()


    const resetToken =
      crypto.randomBytes(32).toString('hex')


    user.twoFactorCode = otp

    user.twoFactorExpiresAt =
      DateTime.now().plus({
        minutes: 10,
      })


    user.resetPasswordToken =
      resetToken


    user.resetPasswordExpiresAt =
      DateTime.now().plus({
        hours: 1,
      })


    await user.save()


    await this.resetPasswordMail.sendOtp(
      user,
      otp
    )


    return {

      success: true,

      message:
        'Si cette adresse email existe, un code de récupération a été envoyé.',

    }

  }


  /**
   * ==========================================================================
   * RENVOYER LE CODE DE RÉCUPÉRATION
   * ==========================================================================
   */
  async resendResetCode(email: string) {

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase()


    const user = await User.findBy(
      'email',
      normalizedEmail
    )


    if (!user) {

      return {

        success: true,

        message:
          'Si cette adresse email existe, un nouveau code a été envoyé.',

      }

    }


    const otp = crypto
      .randomInt(100000, 1000000)
      .toString()


    user.twoFactorCode = otp

    user.twoFactorExpiresAt =
      DateTime.now().plus({
        minutes: 10,
      })


    user.resetPasswordToken =
      crypto.randomBytes(32).toString('hex')


    user.resetPasswordExpiresAt =
      DateTime.now().plus({
        hours: 1,
      })


    await user.save()


    await this.resetPasswordMail.sendOtp(
      user,
      otp
    )


    return {

      success: true,

      message:
        'Si cette adresse email existe, un nouveau code de récupération a été envoyé.',

    }

  }


  /**
   * ==========================================================================
   * VÉRIFIER LE CODE DE RÉCUPÉRATION
   * ==========================================================================
   */
  async verifyResetCode(
    email: string,
    code: string
  ) {

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase()


    const user = await User.findBy(
      'email',
      normalizedEmail
    )


    if (
      !user ||
      !user.twoFactorCode ||
      user.twoFactorCode !== code
    ) {

      throw new Error(
        'Code de vérification incorrect.'
      )

    }


    if (
      !user.twoFactorExpiresAt ||
      user.twoFactorExpiresAt < DateTime.now()
    ) {

      throw new Error(
        'Le code de vérification a expiré.'
      )

    }


    if (
      !user.resetPasswordToken ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt < DateTime.now()
    ) {

      throw new Error(
        'La demande de réinitialisation a expiré.'
      )

    }


    user.twoFactorCode = null

    user.twoFactorExpiresAt = null


    await user.save()


    return {

      success: true,

      message:
        'Code vérifié avec succès.',

      resetToken:
        user.resetPasswordToken,

    }

  }


  /**
   * ==========================================================================
   * RÉINITIALISER LE MOT DE PASSE
   * ==========================================================================
   */
  async resetPassword(payload: any) {

    const user = await User
      .query()
      .where(
        'reset_password_token',
        payload.token
      )
      .first()


    if (!user) {

      throw new Error(
        'Token de réinitialisation invalide.'
      )

    }


    if (
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt < DateTime.now()
    ) {

      throw new Error(
        'La demande de réinitialisation a expiré.'
      )

    }


    const trx = await db.transaction()


    try {

      user.useTransaction(trx)


      user.password =
          payload.password

      user.resetPasswordToken = null

      user.resetPasswordExpiresAt = null

      user.twoFactorCode = null

      user.twoFactorExpiresAt = null


      await user.save()


      /**
       * Invalidation de tous les tokens existants.
       */
      await User.accessTokens
        .deleteAll(user)


      await trx.commit()


      return {

        success: true,

        message:
          'Votre mot de passe a été modifié avec succès.',

      }

    } catch (error) {

      await trx.rollback()

      throw error

    }

  }


  /**
   * ==========================================================================
   * VÉRIFIER EMAIL
   * ==========================================================================
   */
  async verifyEmail(token: string) {

  const user =
    await User
      .query()
      .where(
        'token_verification',
        token
      )
      .first()


  if (!user) {

    throw new Error(
      'Lien de vérification invalide ou déjà utilisé.'
    )

  }


  if (
    !user.tokenVerificationExpiresAt ||
    user.tokenVerificationExpiresAt <
      DateTime.now()
  ) {

    throw new Error(
      'Le lien de vérification a expiré.'
    )

  }


  user.isVerified =
    true


  user.token_verification =
    null


  user.tokenVerificationExpiresAt =
    null


  if (
    user.statut ===
    'EN ATTENTE'
  ) {

    user.statut =
      'ACTIF'

  }


  await user.save()


  return {

    success:
      true,

    message:
      'Votre adresse email est maintenant vérifiée.',

  }

}


  /**
   * ==========================================================================
   * CHANGER LE MOT DE PASSE
   * ==========================================================================
   */
  async changePassword(
    user: User,
    payload: any
  ) {

    if (!user.password) {

      throw new Error(
        'Ce compte ne possède pas de mot de passe local.'
      )

    }


    const valid =
      await hash.verify(
        user.password,
        payload.oldPassword
      )


    if (!valid) {

      throw new Error(
        'Ancien mot de passe incorrect.'
      )

    }


    user.password = payload.password



    await user.save()


    return {

      success: true,

      message:
        'Mot de passe modifié avec succès.',

    }

  }


  /**
   * ==========================================================================
   * SÉRIALISATION UTILISATEUR
   * ==========================================================================
   *
   * Ne jamais retourner :
   * - password
   * - token_verification
   * - reset_password_token
   * - two_factor_code
   */
  private serializeUser(user: User) {

    return {

      id: user.id,

      nom: user.nom,

      postnom: user.postnom,

      prenom: user.prenom,

      pseudo: user.pseudo,

      email: user.email,

      telephone: user.telephone,

      sexe: user.sexe,

      bio: user.bio,

      address: user.address,

      avatarUrl: user.avatarUrl,

      statut: user.statut,

      systemRole: user.systemRole,

      isVerified: user.isVerified,

      lastLoginAt: user.lastLoginAt,

      createdAt: user.createdAt,

    }

  }

}