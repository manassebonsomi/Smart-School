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
   *
   * Dans l'architecture finale, les comptes pourront normalement être créés
   * par :
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
       * ----------------------------------------------------------------------
       * Vérification email
       * ----------------------------------------------------------------------
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
       * ----------------------------------------------------------------------
       * Vérification téléphone
       * ----------------------------------------------------------------------
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
       * ----------------------------------------------------------------------
       * Génération du token de vérification
       * ----------------------------------------------------------------------
       */
      const verificationToken =
        crypto.randomBytes(32).toString('hex')

      /**
       * ----------------------------------------------------------------------
       * Création utilisateur
       * ----------------------------------------------------------------------
       */
      const user = new User()

      user.useTransaction(trx)

      user.merge({
        nom: payload.nom,

        postnom:
          payload.postnom ?? null,

        prenom:
          payload.prenom,

        pseudo:
          payload.pseudo ?? null,

        email,

        telephone,

        sexe:
          payload.sexe ?? null,

        password:
          payload.password,

        statut:
          'EN ATTENTE',

        systemRole:
          SystemRole.USER,

        isVerified:
          false,

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
       * ----------------------------------------------------------------------
       * Envoi email après validation de la transaction
       * ----------------------------------------------------------------------
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
   *
   * Règles :
   *
   * - SUPER_ADMIN :
   *   peut être globalement Super Administrateur tout en étant également
   *   ADMIN_ECOLE dans une ou plusieurs écoles.
   *
   * - UTILISATEUR STANDARD :
   *   doit posséder au moins une appartenance scolaire active.
   *
   * - Une seule école :
   *   le contexte est automatiquement sélectionné.
   *
   * - Plusieurs écoles :
   *   l'utilisateur doit choisir l'école à utiliser.
   */
  async login(payload: any) {
    const email = String(payload.email)
      .trim()
      .toLowerCase()

    /**
     * =========================================================================
     * VÉRIFICATION DES IDENTIFIANTS
     * =========================================================================
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
     * =========================================================================
     * VÉRIFICATION DU STATUT DU COMPTE
     * =========================================================================
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
     * =========================================================================
     * RÉCUPÉRATION DES APPARTENANCES SCOLAIRES
     * =========================================================================
     *
     * IMPORTANT :
     *
     * Cette requête est exécutée également pour un SUPER_ADMIN.
     *
     * Un Super Administrateur peut en effet :
     *
     * - être Super Administrateur au niveau global ;
     * - être rattaché à une ou plusieurs écoles ;
     * - disposer d'un rôle ADMIN_ECOLE dans une école ;
     * - disposer d'un autre rôle dans une autre école.
     *
     * On ne doit donc jamais considérer SUPER_ADMIN comme incompatible avec
     * une appartenance à une école.
     */
    const ecoles = await EcoleUser
      .query()
      .where(
        'user_id',
        user.id
      )
      .where(
        'statut',
        'ACTIF'
      )
      .preload('ecole')

    /**
     * =========================================================================
     * GÉNÉRATION DU TOKEN
     * =========================================================================
     */
    const token = await User.accessTokens.create(
      user,
      ['*'],
      {
        name:
          user.systemRole === SystemRole.SUPER_ADMIN
            ? 'Connexion Super Administrateur'
            : 'Connexion Smart School',

        expiresIn:
          '30 days',
      }
    )

    /**
     * =========================================================================
     * DERNIÈRE CONNEXION
     * =========================================================================
     */
    user.lastLoginAt =
      DateTime.now()

    await user.save()

    /**
     * =========================================================================
     * SUPER ADMIN
     * =========================================================================
     *
     * Un SUPER_ADMIN n'a pas besoin d'école pour se connecter.
     *
     * Toutefois, s'il possède des appartenances scolaires, elles sont
     * retournées afin de permettre une sélection explicite d'une école.
     *
     * Aucun contexte scolaire n'est forcé automatiquement ici.
     */
    if (
      user.systemRole ===
      SystemRole.SUPER_ADMIN
    ) {
      const contexte =
        await UserContext
          .query()
          .where(
            'user_id',
            user.id
          )
          .where(
            'active',
            true
          )
          .preload('ecole')
          .first()

      const ecolesFormatees =
        this.serializeSchools(
          ecoles,
          contexte
        )

      return {
        success: true,

        message:
          'Connexion réussie.',

        data: {
          token: {
            type:
              'bearer',

            value:
              token.value!.release(),

            expiresAt:
              token.expiresAt,
          },

          user:
            this.serializeUser(user),

          ecoles:
            ecolesFormatees,

          contexte,

          mustChooseSchool:
            false,

          isSuperAdmin:
            true,

          redirectTo:
            '/super-admin/dashboard',
        },
      }
    }

    /**
     * =========================================================================
     * UTILISATEUR STANDARD : VÉRIFICATION DES ÉCOLES
     * =========================================================================
     *
     * Un utilisateur standard doit obligatoirement avoir au moins une
     * appartenance scolaire active.
     */
    if (
      ecoles.length === 0
    ) {
      throw new Error(
        "Votre compte n'est associé à aucune école active."
      )
    }

    /**
     * =========================================================================
     * VARIABLES DU CONTEXTE
     * =========================================================================
     */
    let contexte:
      UserContext | null = null

    let redirectTo =
      '/home'

    let mustChooseSchool =
      false

    /**
     * =========================================================================
     * UNE SEULE ÉCOLE
     * =========================================================================
     *
     * Dans ce cas, cette école devient automatiquement l'école active.
     *
     * Le rôle enregistré dans UserContext doit toujours être celui du
     * membership EcoleUser correspondant.
     */
    if (
      ecoles.length === 1
    ) {
      const membership =
        ecoles[0]

      /**
       * ----------------------------------------------------------------------
       * Désactiver les anciens contextes
       * ----------------------------------------------------------------------
       */
      await UserContext
        .query()
        .where(
          'user_id',
          user.id
        )
        .update({
          active:
            false,
        })

      /**
       * ----------------------------------------------------------------------
       * Création / mise à jour du contexte
       * ----------------------------------------------------------------------
       */
      contexte =
        await UserContext.updateOrCreate(
          {
            userId:
              user.id,

            ecoleId:
              membership.ecoleId,
          },

          {
            role:
              membership.role,

            active:
              true,
          }
        )

      /**
       * ----------------------------------------------------------------------
       * Déterminer l'espace de destination
       * ----------------------------------------------------------------------
       */
      if (
        membership.role ===
        'ADMIN_ECOLE'
      ) {
        redirectTo =
          '/school-admin/dashboard'
      } else if (
        membership.role === 'ENSEIGNANT' ||
        membership.role === 'TEACHER'
      ) {
        redirectTo =
          '/teacher/dashboard'
      } else if (
        membership.role === 'PARENT'
      ) {
        redirectTo =
          '/parent/dashboard'
      } else if (
        membership.role === 'ELEVE' ||
        membership.role === 'STUDENT'
      ) {
        redirectTo =
          '/student/dashboard'
      } else {
        redirectTo =
          '/home'
      }

      /**
       * Charger l'école dans le contexte retourné.
       */
      if (!contexte.ecole) {
        await contexte.load('ecole')
      }
    }

    /**
     * =========================================================================
     * PLUSIEURS ÉCOLES
     * =========================================================================
     *
     * On ne force aucune école arbitrairement.
     *
     * L'utilisateur passe par /choisir-ecole et le frontend appelle ensuite
     * switchSchool().
     */
    if (
      ecoles.length > 1
    ) {
      mustChooseSchool =
        true

      redirectTo =
        '/choisir-ecole'

      /**
       * Récupérer un éventuel contexte déjà actif.
       *
       * IMPORTANT :
       * il n'est pas modifié ici.
       */
      contexte =
        await UserContext
          .query()
          .where(
            'user_id',
            user.id
          )
          .where(
            'active',
            true
          )
          .preload('ecole')
          .first()
    }

    /**
     * =========================================================================
     * FORMATAGE DES ÉCOLES
     * =========================================================================
     *
     * Le frontend de /choisir-ecole travaille avec des objets école directs :
     *
     * school.id
     * school.nom
     * school.code
     * school.ville
     * school.role
     *
     * On ne retourne donc pas directement EcoleUser.
     */
    const ecolesFormatees =
      this.serializeSchools(
        ecoles,
        contexte
      )

    /**
     * =========================================================================
     * RÉPONSE
     * =========================================================================
     */
    return {
      success:
        true,

      message:
        'Connexion réussie.',

      data: {
        token: {
          type:
            'bearer',

          value:
            token.value!.release(),

          expiresAt:
            token.expiresAt,
        },

        user:
          this.serializeUser(user),

        ecoles:
          ecolesFormatees,

        contexte,

        mustChooseSchool,

        isSuperAdmin:
          false,

        redirectTo,
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
      success:
        true,

      message:
        'Déconnexion effectuée avec succès.',
    }
  }

  /**
   * ==========================================================================
   * UTILISATEUR CONNECTÉ
   * ==========================================================================
   *
   * Retourne :
   *
   * - les informations publiques du compte ;
   * - toutes les écoles auxquelles il est activement rattaché ;
   * - le contexte scolaire actuellement actif ;
   * - le statut Super Admin.
   */
  async me(user: User) {
    const ecoles = await EcoleUser
      .query()
      .where(
        'user_id',
        user.id
      )
      .where(
        'statut',
        'ACTIF'
      )
      .preload('ecole')

    const context = await UserContext
      .query()
      .where(
        'user_id',
        user.id
      )
      .where(
        'active',
        true
      )
      .preload('ecole')
      .first()

    const ecolesFormatees =
      this.serializeSchools(
        ecoles,
        context
      )

    return {
      user:
        this.serializeUser(user),

      ecoles:
        ecolesFormatees,

      context,

      isSuperAdmin:
        user.systemRole === SystemRole.SUPER_ADMIN,
    }
  }

  /**
   * ==========================================================================
   * CHANGER D'ÉCOLE
   * ==========================================================================
   *
   * IMPORTANT :
   *
   * Le SUPER_ADMIN est autorisé à utiliser cette méthode.
   *
   * Exemple :
   *
   * user.systemRole = SUPER_ADMIN
   *
   * Ecole A => ADMIN_ECOLE
   * Ecole B => TEACHER
   *
   * Le rôle actif dépend alors de l'école sélectionnée et non du
   * systemRole global.
   */
  async switchSchool(
    user: User,
    ecoleId: number
  ) {
    /**
     * =========================================================================
     * VÉRIFICATION DE L'APPARTENANCE
     * =========================================================================
     *
     * Aucun contrôle sur user.systemRole n'est effectué ici.
     *
     * On vérifie uniquement que l'utilisateur possède réellement une
     * appartenance active à l'école demandée.
     */
    const membership = await EcoleUser
      .query()
      .where(
        'user_id',
        user.id
      )
      .where(
        'ecole_id',
        ecoleId
      )
      .where(
        'statut',
        'ACTIF'
      )
      .preload('ecole')
      .first()

    if (!membership) {
      throw new Error(
        "Vous n'avez pas accès à cette école."
      )
    }

    /**
     * =========================================================================
     * VÉRIFICATION DE L'ÉCOLE
     * =========================================================================
     */
    if (!membership.ecole) {
      throw new Error(
        "L'école sélectionnée est introuvable."
      )
    }

    if (
      membership.ecole.statut !==
      'ACTIF'
    ) {
      throw new Error(
        "Cette école n'est pas active actuellement."
      )
    }

    /**
     * =========================================================================
     * DÉSACTIVER LES AUTRES CONTEXTES
     * =========================================================================
     */
    await UserContext
      .query()
      .where(
        'user_id',
        user.id
      )
      .update({
        active:
          false,
      })

    /**
     * =========================================================================
     * ACTIVER / CRÉER LE CONTEXTE
     * =========================================================================
     *
     * Le rôle est toujours synchronisé avec EcoleUser.role.
     *
     * Cela garantit par exemple :
     *
     * École A => ADMIN_ECOLE
     * École B => TEACHER
     *
     * Lors du changement d'école, le middleware travaillera donc avec le rôle
     * correspondant à l'école active.
     */
    let context = await UserContext
      .query()
      .where(
        'user_id',
        user.id
      )
      .where(
        'ecole_id',
        ecoleId
      )
      .first()

    if (context) {
      context.role =
        membership.role

      context.active =
        true

      await context.save()
    } else {
      context =
        await UserContext.create({
          userId:
            user.id,

          ecoleId:
            ecoleId,

          role:
            membership.role,

          active:
            true,
        })
    }

    /**
     * Charger l'école si le contexte existait déjà.
     */
    if (!context.ecole) {
      await context.load('ecole')
    }

    return {
      success:
        true,

      message:
        'École active modifiée avec succès.',

      context: {
        id:
          context.id,

        userId:
          context.userId,

        ecoleId:
          context.ecoleId,

        role:
          context.role,

        active:
          context.active,

        ecole:
          membership.ecole,
      },
    }
  }

  /**
   * ==========================================================================
   * MOT DE PASSE OUBLIÉ
   * ==========================================================================
   */
  async forgotPassword(
    email: string
  ) {
    const normalizedEmail = String(email)
      .trim()
      .toLowerCase()

    const user = await User.findBy(
      'email',
      normalizedEmail
    )

    /**
     * Même réponse si le compte n'existe pas afin de ne pas révéler
     * l'existence des comptes.
     */
    if (!user) {
      return {
        success:
          true,

        message:
          'Si cette adresse email existe, un code de récupération a été envoyé.',
      }
    }

    const otp = crypto
      .randomInt(
        100000,
        1000000
      )
      .toString()

    const resetToken =
      crypto.randomBytes(32).toString('hex')

    user.twoFactorCode =
      otp

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
      success:
        true,

      message:
        'Si cette adresse email existe, un code de récupération a été envoyé.',
    }
  }

  /**
   * ==========================================================================
   * RENVOYER LE CODE DE RÉCUPÉRATION
   * ==========================================================================
   */
  async resendResetCode(
    email: string
  ) {
    const normalizedEmail = String(email)
      .trim()
      .toLowerCase()

    const user = await User.findBy(
      'email',
      normalizedEmail
    )

    if (!user) {
      return {
        success:
          true,

        message:
          'Si cette adresse email existe, un nouveau code a été envoyé.',
      }
    }

    const otp = crypto
      .randomInt(
        100000,
        1000000
      )
      .toString()

    user.twoFactorCode =
      otp

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
      success:
        true,

      message:
        'Si cette adresse email existe, un nouveau code a été envoyé.',
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
      user.twoFactorExpiresAt <
        DateTime.now()
    ) {
      throw new Error(
        'Le code de vérification a expiré.'
      )
    }

    if (
      !user.resetPasswordToken ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt <
        DateTime.now()
    ) {
      throw new Error(
        'La demande de réinitialisation a expiré.'
      )
    }

    user.twoFactorCode =
      null

    user.twoFactorExpiresAt =
      null

    await user.save()

    return {
      success:
        true,

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
  async resetPassword(
    payload: {
      token: string
      password: string
    }
  ) {
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
      user.resetPasswordExpiresAt <
        DateTime.now()
    ) {
      throw new Error(
        'La demande de réinitialisation a expiré.'
      )
    }

    /**
     * Le modèle User se charge du hash du mot de passe
     * via son mécanisme de sauvegarde.
     */
    user.password =
      payload.password

    user.resetPasswordToken =
      null

    user.resetPasswordExpiresAt =
      null

    user.twoFactorCode =
      null

    user.twoFactorExpiresAt =
      null

    await user.save()

    return {
      success:
        true,

      message:
        'Votre mot de passe a été modifié avec succès.',
    }
  }

  /**
   * ==========================================================================
   * VÉRIFIER EMAIL
   * ==========================================================================
   */
  async verifyEmail(
    token: string
  ) {
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

    user.password =
      payload.password

    await user.save()

    return {
      success:
        true,

      message:
        'Mot de passe modifié avec succès.',
    }
  }

  /**
   * ==========================================================================
   * SÉRIALISATION DES ÉCOLES UTILISATEUR
   * ==========================================================================
   *
   * EcoleUser représente une appartenance.
   *
   * Le frontend, lui, doit recevoir directement les informations de l'école
   * ainsi que le rôle de l'utilisateur dans cette école.
   *
   * Exemple :
   *
   * {
   *   id: 12,
   *   nom: "Institut X",
   *   code: "INS-X",
   *   ville: "Kinshasa",
   *   province: "Kinshasa",
   *   statut: "ACTIF",
   *   role: "ADMIN_ECOLE",
   *   membershipId: 35,
   *   membershipStatus: "ACTIF",
   *   active: false
   * }
   */
  private serializeSchools(
    memberships: EcoleUser[],
    activeContext: UserContext | null = null
  ) {
    return memberships
      .filter(
        (membership) =>
          membership.ecole &&
          membership.ecole.statut === 'ACTIF'
      )
      .map(
        (membership) => ({
          id:
            membership.ecoleId,

          nom:
            membership.ecole?.nom ?? null,

          code:
            membership.ecole?.code ?? null,

          description:
            membership.ecole?.description ?? null,

          email:
            membership.ecole?.email ?? null,

          telephone:
            membership.ecole?.telephone ?? null,

          adresse:
            membership.ecole?.adresse ?? null,

          ville:
            membership.ecole?.ville ?? null,

          pays:
            membership.ecole?.pays ?? null,

          province:
            membership.ecole?.province ?? null,

          commune:
            membership.ecole?.commune ?? null,

          quartier:
            membership.ecole?.quartier ?? null,

          siteWeb:
            membership.ecole?.siteWeb ?? null,

          type:
            membership.ecole?.type ?? null,

          anneeCreation:
            membership.ecole?.anneeCreation ?? null,

          logo:
            membership.ecole?.logo ?? null,

          statut:
            membership.ecole?.statut ?? null,

          role:
            membership.role,

          membershipId:
            membership.id,

          membershipStatus:
            membership.statut,

          active:
            activeContext
              ? Number(activeContext.ecoleId) ===
                Number(membership.ecoleId)
              : false,
        })
      )
  }

  /**
   * ==========================================================================
   * SÉRIALISATION UTILISATEUR
   * ==========================================================================
   *
   * Ne jamais retourner :
   *
   * - password
   * - token_verification
   * - reset_password_token
   * - two_factor_code
   * - autres secrets d'authentification
   */
  private serializeUser(
    user: User
  ) {
    return {
      id:
        user.id,

      nom:
        user.nom,

      postnom:
        user.postnom,

      prenom:
        user.prenom,

      pseudo:
        user.pseudo,

      email:
        user.email,

      telephone:
        user.telephone,

      sexe:
        user.sexe,

      bio:
        user.bio,

      address:
        user.address,

      avatarUrl:
        user.avatarUrl,

      statut:
        user.statut,

      systemRole:
        user.systemRole,

      isVerified:
        user.isVerified,

      lastLoginAt:
        user.lastLoginAt,

      createdAt:
        user.createdAt,
    }
  }
}