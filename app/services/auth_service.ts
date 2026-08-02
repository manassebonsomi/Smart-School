import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

import User from '#models/user'
import EcoleUser from '#models/ecole_user'
import UserContext from '#models/user_context'

import VerifyEmailMail from '#mails/verify_email'
import ResetPasswordMail from '#mails/reset_password'

type UserModelWithAccessTokens = typeof User & {
  accessTokens: {
    create(user: User): Promise<any>
    delete(user: User, tokenId: number): Promise<void>
  }
}

export default class AuthService {

  private verifyEmailMail = new VerifyEmailMail()
  private resetPasswordMail = new ResetPasswordMail()

  /**
   * ==========================================================================
   * INSCRIPTION
   * ==========================================================================
   */
  async register(payload: any) {

    const trx = await db.transaction()

    try {

      const emailExists = await User.query({ client: trx })
        .where('email', payload.email)
        .first()

      if (emailExists) {
        throw new Error("Cette adresse email est déjà utilisée.")
      }

      if (payload.telephone) {

        const phoneExists = await User.query({ client: trx })
          .where('telephone', payload.telephone)
          .first()

        if (phoneExists) {
          throw new Error("Ce numéro de téléphone est déjà utilisé.")
        }

      }

      const password = await hash.make(payload.password)

      const verificationToken = crypto.randomUUID()

      const user = await User.create({
        nom: payload.nom,
        postnom: payload.postnom,
        prenom: payload.prenom,
        pseudo: payload.pseudo,
        email: payload.email,
        telephone: payload.telephone,
        sexe: payload.sexe,
        password,
        statut: 'EN_ATTENTE',
        isVerified: false,
        token_verification: verificationToken,
        tokenVerificationExpiresAt: DateTime.now().plus({hours:24})

      }, { client: trx })

      await trx.commit()

      await this.verifyEmailMail.send(user, verificationToken)

      return {
        success: true,
        message: 'Compte créé avec succès.',
        user,
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

    const user = await User.findBy('email', payload.email)

    if (!user) {
      throw new Error('Adresse email ou mot de passe incorrect.')
    }

    if (!user.password) {
      throw new Error('Ce compte utilise une connexion externe.')
    }

    const isValidPassword = await hash.verify(
      user.password,
      payload.password
    )

    if (!isValidPassword) {
      throw new Error('Adresse email ou mot de passe incorrect.')
    }

    if (user.statut !== 'ACTIF') {
      throw new Error("Votre compte est désactivé.")
    }

    // const token = await (User as UserModelWithAccessTokens).accessTokens.create(user)
    const ecoles = await EcoleUser
      .query()
      .where('user_id', user.id)
      .preload('ecole')

    /**
     * Création du token
     */
    const token = await User.accessTokens.create(user)
     user.lastLoginAt = DateTime.now()
     await user.save()

     /**
     * Une seule école
     */
    if (ecoles.length === 1) {

      await UserContext.updateOrCreate(

        {
          userId: user.id
        },

        {
          ecoleId: ecoles[0].ecoleId,
          role: ecoles[0].role
        }

      )

    }

    return {

      success: true,
      message: "Connexion réussie.",
      token,
      user,
      ecoles,
      mustChooseSchool: ecoles.length > 1
    }

  }

  /**
   * ==========================================================================
   * DECONNEXION
   * ==========================================================================
   */
  async logout(user: User, tokenId: number) {

    // await (User as UserModelWithAccessTokens).accessTokens.delete(user, tokenId)
    await User.accessTokens.delete(
      user,
      tokenId
    )

    return {
      success: true,
      message: 'Déconnexion effectuée avec succès.',
    }

  }

  /**
   * ==========================================================================
   * UTILISATEUR CONNECTE
   * ==========================================================================
   */
   async me(user: User) {

    await user.load('ecoles')

    const context = await UserContext
      .query()
      .where('user_id', user.id)
      .preload('ecole')
      .first()


    return {
      user,
      context
    }

  }

  /**
   * ==========================================================================
   * CHANGER D'ECOLE
   * ==========================================================================
   */
    async switchSchool(user: User, ecoleId: number) {

    const membership = await EcoleUser
      .query()
      .where('user_id', user.id)
      .where('ecole_id', ecoleId)
      .where('statut', 'ACTIF')
      .first()

    if (!membership) {

      throw new Error(
        "Vous n'avez pas accès à cette école."
      )

    }



    await UserContext.updateOrCreate(

      {
        userId: user.id
      },

      {
        ecoleId: membership.ecoleId,

        role: membership.role

      }

    )



    return {

      success: true,

      message: "École changée avec succès.",

      context: {

        ecoleId: membership.ecoleId,

        role: membership.role

      }

    }

  }

  /**
   * ==========================================================================
   * MOT DE PASSE OUBLIE
   * ==========================================================================
   */
 async forgotPassword(email: string) {

  const user = await User.findBy('email', email)

  if (!user) {
    return {
      success: true,
      message: "Si cette adresse email existe, un lien de réinitialisation sera envoyé."
    }
  }

  const token = crypto.randomUUID()

  user.resetPasswordToken = token

  user.resetPasswordExpiresAt = DateTime.now().plus({ hours: 1 })

  await user.save()

  await this.resetPasswordMail.send(user, token)

  return {

    success: true,

    message: "Un lien de réinitialisation a été généré.",

    token

  }

}

  /**
   * ==========================================================================
   * REINITIALISATION
   * ==========================================================================
   */
 async resetPassword(payload: any) {

  const user = await User
    .query()
    .where('reset_password_token', payload.token)
    .first()

  if (!user) {
    throw new Error("Token invalide.")
  }

  if (
    !user.resetPasswordExpiresAt ||
    user.resetPasswordExpiresAt < DateTime.now()
  ) {
    throw new Error("Le lien de réinitialisation a expiré.")
  }

  user.password = await hash.make(payload.password)

  user.resetPasswordToken = null

  user.resetPasswordExpiresAt = null

  await user.save()

  return {

    success: true,

    message: "Votre mot de passe a été modifié avec succès."

  }

}
  /**
   * ==========================================================================
   * VERIFICATION EMAIL
   * ==========================================================================
   */
 async verifyEmail(token: string) {

  const user = await User
    .query()
    .where('token_verification', token)
    .first()

  if (!user) {
    throw new Error("Lien de vérification invalide.")
  }

  if (
    !user.tokenVerificationExpiresAt ||
    user.tokenVerificationExpiresAt < DateTime.now()
  ) {
    throw new Error("Le lien de vérification a expiré.")
  }

  user.isVerified = true

  user.token_verification = null

  user.tokenVerificationExpiresAt = null

  await user.save()

  return {

    success: true,

    message: "Votre adresse email est maintenant vérifiée."

  }

}

/**
   * ==========================================================================
   * CHANGER MOT DE PASSE
   * ==========================================================================
   */
  async changePassword(user:User, payload:any){

    const valid = await hash.verify(user.password, payload.oldPassword)

    if(!valid){
      throw new Error("Ancien mot de passe incorrect.")
    }

    user.password = await hash.make(payload.password)
    await user.save()

    return {
      success:true,
      message:"Mot de passe modifié."
    }


  }

}