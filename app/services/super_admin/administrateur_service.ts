import crypto from 'node:crypto'

import db from '@adonisjs/lucid/services/db'
// import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

import User from '#models/user'
import Ecole from '#models/ecole'
import EcoleUser from '#models/ecole_user'
import UserContext from '#models/user_context'

import VerifyEmailMail from '#mails/verify_email'

import { SystemRole } from '../../enums/system_role.ts'


export default class AdministrateurService {

  private verifyEmailMail =
    new VerifyEmailMail()


  /**
   * ==========================================================================
   * CRÉER UN ADMINISTRATEUR
   * ==========================================================================
   */
  async create(
    ecoleId: number,
    payload: any
  ) {

    const trx =
      await db.transaction()


    try {

      const school =
        await Ecole
          .query({
            client: trx,
          })
          .where(
            'id',
            ecoleId
          )
          .first()


      if (!school) {

        throw new Error(
          "L'école sélectionnée n'existe pas."
        )

      }


      if (
        school.statut !== 'ACTIF'
      ) {

        throw new Error(
          "Impossible d'ajouter un administrateur à une école qui n'est pas active."
        )

      }


      const email =
        this.normalizeEmail(
          payload.email
        )


      if (!email) {

        throw new Error(
          "L'adresse email est obligatoire."
        )

      }


      const emailExists =
        await User
          .query({
            client: trx,
          })
          .where(
            'email',
            email
          )
          .first()


      if (emailExists) {

        throw new Error(
          'Cette adresse email existe déjà.'
        )

      }


      const telephone =
        this.normalizeValue(
          payload.telephone
        )


      if (telephone) {

        const phoneExists =
          await User
            .query({
              client: trx,
            })
            .where(
              'telephone',
              telephone
            )
            .first()


        if (phoneExists) {

          throw new Error(
            'Ce numéro de téléphone existe déjà.'
          )

        }

      }


      if (
        !payload.password ||
        String(payload.password).length < 8
      ) {

        throw new Error(
          'Le mot de passe doit contenir au moins 8 caractères.'
        )

      }


      const verificationToken =
        crypto
          .randomBytes(32)
          .toString('hex')


      const user =
        new User()


      user.useTransaction(
        trx
      )


      user.merge({

        nom:
          payload.nom,

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

        /**
         * Un seul hash du mot de passe.
         *
         * Ton modèle User doit conserver la valeur hashée.
         */
        password:
            payload.password,

        statut:
          'ACTIF',

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


      /**
       * Relation utilisateur / école.
       */
      const membership =
        new EcoleUser()


      membership.useTransaction(
        trx
      )


      membership.merge({

        userId:
          user.id,

        ecoleId,

        role:
          'ADMIN_ECOLE',

        statut:
          'ACTIF',

      })


      await membership.save()


      /**
       * Désactiver les anciens contextes.
       */
      await UserContext
        .query({
          client: trx,
        })
        .where(
          'user_id',
          user.id
        )
        .update({
          active: false,
        })


      /**
       * Créer le nouveau contexte actif.
       */
      const context =
        new UserContext()


      context.useTransaction(
        trx
      )


      context.merge({

        userId:
          user.id,

        ecoleId,

        active:
          true,

      })


      await context.save()


      await trx.commit()


      /**
       * Envoi du mail après commit.
       */
      await this.verifyEmailMail.send(
        user,
        verificationToken
      )


      return {

        success:
          true,

        message:
          "Administrateur d'école créé avec succès.",

        data:
          await this.serializeUser(
            user
          ),

      }

    } catch (error) {

      await trx.rollback()

      throw error

    }

  }


  /**
   * ==========================================================================
   * MODIFIER
   * ==========================================================================
   */
  async update(
    id: number,
    payload: any
  ) {

    const user =
      await this.findAdmin(id)


    const email =
      payload.email !== undefined
        ? this.normalizeEmail(
            payload.email
          )
        : user.email


    const telephone =
      payload.telephone !== undefined
        ? this.normalizeValue(
            payload.telephone
          )
        : user.telephone


    if (
      email &&
      email !== user.email
    ) {

      const exists =
        await User
          .query()
          .where(
            'email',
            email
          )
          .whereNot(
            'id',
            id
          )
          .first()


      if (exists) {

        throw new Error(
          'Cette adresse email existe déjà.'
        )

      }

    }


    if (
      telephone &&
      telephone !== user.telephone
    ) {

      const exists =
        await User
          .query()
          .where(
            'telephone',
            telephone
          )
          .whereNot(
            'id',
            id
          )
          .first()


      if (exists) {

        throw new Error(
          'Ce numéro de téléphone existe déjà.'
        )

      }

    }


    user.merge({

      nom:
        payload.nom ??
        user.nom,

      postnom:
        payload.postnom !== undefined
          ? payload.postnom
          : user.postnom,

      prenom:
        payload.prenom ??
        user.prenom,

      pseudo:
        payload.pseudo !== undefined
          ? payload.pseudo
          : user.pseudo,

      email:
        email ??
        undefined,

      telephone,

      sexe:
        payload.sexe !== undefined
          ? payload.sexe
          : user.sexe,

      statut:
        payload.statut ??
        user.statut,

    })


    if (
      payload.password
    ) {

      if (
        String(payload.password).length < 8
      ) {

        throw new Error(
          'Le nouveau mot de passe doit contenir au moins 8 caractères.'
        )

      }


      user.password =
          payload.password

    }


    await user.save()


    return {

      success:
        true,

      message:
        'Administrateur modifié avec succès.',

      data:
        await this.serializeUser(
          user
        ),

    }

  }


  /**
   * ==========================================================================
   * SUSPENDRE
   * ==========================================================================
   */
  async suspend(
    id: number
  ) {

    const user =
      await this.findAdmin(
        id
      )


    const trx =
      await db.transaction()


    try {

      user.useTransaction(
        trx
      )


      user.statut =
        'INACTIF'


      await user.save()


      await EcoleUser
        .query({
          client: trx,
        })
        .where(
          'user_id',
          id
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )
        .update({

          statut:
            'INACTIF',

        })


      await UserContext
        .query({
          client: trx,
        })
        .where(
          'user_id',
          id
        )
        .update({

          active:
            false,

        })


      await trx.commit()


      return {

        success:
          true,

        message:
          'Administrateur suspendu avec succès.',

        data:
          await this.serializeUser(
            user
          ),

      }

    } catch (error) {

      await trx.rollback()

      throw error

    }

  }


  /**
   * ==========================================================================
   * RÉACTIVER
   * ==========================================================================
   */
  async activate(
    id: number
  ) {

    const user =
      await this.findAdmin(
        id
      )


    const trx =
      await db.transaction()


    try {

      user.useTransaction(
        trx
      )


      user.statut =
        'ACTIF'


      await user.save()


      await EcoleUser
        .query({
          client: trx,
        })
        .where(
          'user_id',
          id
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )
        .update({

          statut:
            'ACTIF',

        })


      await trx.commit()


      return {

        success:
          true,

        message:
          'Administrateur réactivé avec succès.',

        data:
          await this.serializeUser(
            user
          ),

      }

    } catch (error) {

      await trx.rollback()

      throw error

    }

  }


  /**
   * ==========================================================================
   * SUPPRESSION LOGIQUE
   * ==========================================================================
   */
  async delete(
    id: number
  ) {

    const user =
      await this.findAdmin(
        id
      )


    const trx =
      await db.transaction()


    try {

      user.useTransaction(
        trx
      )


      user.statut =
        'SUPPRIME'


      user.deletedAt =
        DateTime.now()


      await user.save()


      await EcoleUser
        .query({
          client: trx,
        })
        .where(
          'user_id',
          id
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )
        .update({

          statut:
            'INACTIF',

        })


      await UserContext
        .query({
          client: trx,
        })
        .where(
          'user_id',
          id
        )
        .update({

          active:
            false,

        })


      await trx.commit()


      return {

        success:
          true,

        message:
          'Administrateur supprimé avec succès.',

      }

    } catch (error) {

      await trx.rollback()

      throw error

    }

  }


  /**
   * ==========================================================================
   * LISTE PAGINÉE
   * ==========================================================================
   */
  async findAll(
    page = 1,
    limit = 10,
    filters: any = {}
  ) {

    const safePage =
      Math.max(
        1,
        Number(page) || 1
      )


    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) || 10,
          1
        ),
        100
      )


    const query =
      User
        .query()
        .whereNull(
          'deleted_at'
        )
        .whereHas(
          'ecoles',
          (builder) => {

            builder
              .wherePivot(
                'role',
                'ADMIN_ECOLE'
              )

          }
        )


    if (
      filters.search
    ) {

      const search =
        `%${String(
          filters.search
        ).trim()}%`


      query.where(
        (builder) => {

          builder
            .whereILike(
              'nom',
              search
            )
            .orWhereILike(
              'postnom',
              search
            )
            .orWhereILike(
              'prenom',
              search
            )
            .orWhereILike(
              'email',
              search
            )
            .orWhereILike(
              'telephone',
              search
            )
            .orWhereILike(
              'pseudo',
              search
            )

        }
      )

    }


    if (
      filters.statut
    ) {

      query.where(
        'statut',
        filters.statut
      )

    }


    if (
      filters.ecoleId
    ) {

      query.whereHas(
        'ecoles',
        (builder) => {

          builder
            .wherePivot(
              'ecole_id',
              Number(
                filters.ecoleId
              )
            )
            .wherePivot(
              'role',
              'ADMIN_ECOLE'
            )

        }
      )

    }


    const allowedSorts = [

      'nom',

      'prenom',

      'email',

      'created_at',

      'last_login_at',

      'statut',

    ]


    const sortBy =
      allowedSorts.includes(
        filters.sortBy
      )
        ? filters.sortBy
        : 'created_at'


    const order =
      filters.order === 'asc'
        ? 'asc'
        : 'desc'


    query.orderBy(
      sortBy,
      order
    )


    query.preload(
      'ecoles',
      (relation) => {

        relation.pivotColumns([
          'role',
          'statut',
        ])

      }
    )


    const result =
      await query.paginate(
        safePage,
        safeLimit
      )


    const data =
      await Promise.all(
        result
          .all()
          .map(
            user =>
              this.serializeUser(
                user
              )
          )
      )


    return {

      success:
        true,

      data: {

        meta:
          result.getMeta(),

        data,

      },

    }

  }


  /**
   * ==========================================================================
   * ADMINISTRATEURS D'UNE ÉCOLE
   * ==========================================================================
   */
  async getBySchool(
    ecoleId: number
  ) {

    const school =
      await Ecole.find(
        ecoleId
      )


    if (!school) {

      throw new Error(
        "Cette école n'existe pas."
      )

    }


    const memberships =
      await EcoleUser
        .query()
        .where(
          'ecole_id',
          ecoleId
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )
        .whereNot(
          'statut',
          'INACTIF'
        )


    const userIds =
      memberships.map(
        membership =>
          membership.userId
      )


    if (!userIds.length) {

      return {

        success:
          true,

        data: [],

      }

    }


    const users =
      await User
        .query()
        .whereIn(
          'id',
          userIds
        )
        .whereNull(
          'deleted_at'
        )
        .orderBy(
          'created_at',
          'desc'
        )


    return {

      success:
        true,

      data:
        await Promise.all(
          users.map(
            user =>
              this.serializeUser(
                user
              )
          )
        ),

    }

  }


  /**
   * ==========================================================================
   * STATISTIQUES
   * ==========================================================================
   */
  async statistics() {

    const base =
      User
        .query()
        .whereNull(
          'deleted_at'
        )
        .whereHas(
          'ecoles',
          builder =>
            builder.wherePivot(
              'role',
              'ADMIN_ECOLE'
            )
        )


    const [
      total,
      actifs,
      inactifs,
      supprimés,
      nouveaux,
      jamaisConnectes,
    ] = await Promise.all([

      base.clone()
        .count('* as total'),

      base.clone()
        .where(
          'statut',
          'ACTIF'
        )
        .count('* as total'),

      base.clone()
        .where(
          'statut',
          'INACTIF'
        )
        .count('* as total'),

      User
        .query()
        .where(
          'statut',
          'SUPPRIME'
        )
        .count('* as total'),

      base.clone()
        .where(
          'created_at',
          '>=',
          DateTime
            .now()
            .startOf(
              'month'
            )
            .toSQL()!
        )
        .count('* as total'),

      base.clone()
        .whereNull(
          'last_login_at'
        )
        .count('* as total'),

    ])


    const totalCount =
      Number(
        total[0].$extras.total
      )


    const activeCount =
      Number(
        actifs[0].$extras.total
      )


    const newCount =
      Number(
        nouveaux[0].$extras.total
      )


    const neverLoginCount =
      Number(
        jamaisConnectes[0].$extras.total
      )


    return {

      total:
        totalCount,

      actifs:
        activeCount,

      inactifs:
        Number(
          inactifs[0].$extras.total
        ),

      supprimes:
        Number(
          supprimés[0].$extras.total
        ),

      nouveaux:
        newCount,

      jamaisConnectes:
        neverLoginCount,

      tauxActifs:
        totalCount > 0
          ? Number(
              (
                activeCount /
                totalCount
              ).toFixed(1)
            )
          : 0,

      tauxAvecConnexion:
        totalCount > 0
          ? Number(
              (
                (
                  totalCount -
                  neverLoginCount
                ) /
                totalCount *
                100
              ).toFixed(1)
            )
          : 0,

    }

  }


  /**
   * ==========================================================================
   * DÉTAILS
   * ==========================================================================
   */
  async details(
    id: number
  ) {

    const user =
      await this.findAdmin(
        id
      )


    const memberships =
      await EcoleUser
        .query()
        .where(
          'user_id',
          id
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )


    const schoolIds =
      memberships.map(
        membership =>
          membership.ecoleId
      )


    const schools =
      schoolIds.length
        ? await Ecole
            .query()
            .whereIn(
              'id',
              schoolIds
            )
        : []


    const context =
      await UserContext
        .query()
        .where(
          'user_id',
          id
        )
        .where(
          'active',
          true
        )
        .first()


    return {

      success:
        true,

      data: {

        ...(await this.serializeUser(
          user
        )),

        activeSchoolId:
          context?.ecoleId ??
          null,

        ecoles:
          schools.map(
            school => {

              const membership =
                memberships.find(
                  item =>
                    item.ecoleId ===
                    school.id
                )


              return {

                id:
                  school.id,

                nom:
                  school.nom,

                code:
                  school.code,

                statut:
                  school.statut,

                role:
                  membership?.role,

                membershipStatus:
                  membership?.statut,

                active:
                  Number(
                    context?.ecoleId
                  ) ===
                  Number(
                    school.id
                  ),

              }

            }
          ),

      },

    }

  }


  /**
   * ==========================================================================
   * CHANGER L'ÉCOLE ACTIVE
   * ==========================================================================
   */
  async switchSchool(
    userId: number,
    ecoleId: number
  ) {

    const membership =
      await EcoleUser
        .query()
        .where(
          'user_id',
          userId
        )
        .where(
          'ecole_id',
          ecoleId
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )
        .where(
          'statut',
          'ACTIF'
        )
        .first()


    if (!membership) {

      throw new Error(
        "Cet administrateur n'appartient pas à cette école active."
      )

    }


    const trx =
      await db.transaction()


    try {

      await UserContext
        .query({
          client: trx,
        })
        .where(
          'user_id',
          userId
        )
        .update({
          active:
            false,
        })


      const context =
        await UserContext
          .query({
            client: trx,
          })
          .where(
            'user_id',
            userId
          )
          .where(
            'ecole_id',
            ecoleId
          )
          .first()


      if (context) {

        context.useTransaction(
          trx
        )

        context.active =
          true

        await context.save()

      } else {

        const newContext =
          new UserContext()


        newContext.useTransaction(
          trx
        )


        newContext.merge({

          userId,

          ecoleId,

          active:
            true,

        })


        await newContext.save()

      }


      await trx.commit()


      return {

        success:
          true,

        message:
          'École active changée avec succès.',

        data: {

          userId,

          ecoleId,

          role:
            membership.role,

        },

      }

    } catch (error) {

      await trx.rollback()

      throw error

    }

  }


  /**
   * ==========================================================================
   * APPARTENANCE
   * ==========================================================================
   */
  async belongsToSchool(
    userId: number,
    ecoleId: number
  ) {

    return !!(
      await EcoleUser
        .query()
        .where(
          'user_id',
          userId
        )
        .where(
          'ecole_id',
          ecoleId
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )
        .where(
          'statut',
          'ACTIF'
        )
        .first()
    )

  }


  /**
   * ==========================================================================
   * SUPPRESSION DÉFINITIVE
   * ==========================================================================
   */
  async forceDelete(
    id: number
  ) {

    const user =
      await this.findAdmin(
        id
      )


    const trx =
      await db.transaction()


    try {

      await EcoleUser
        .query({
          client: trx,
        })
        .where(
          'user_id',
          id
        )
        .delete()


      await UserContext
        .query({
          client: trx,
        })
        .where(
          'user_id',
          id
        )
        .delete()


      await User
        .query({
          client: trx,
        })
        .where(
          'id',
          user.id
        )
        .delete()


      await trx.commit()


      return {

        success:
          true,

        message:
          'Administrateur supprimé définitivement.',

      }

    } catch (error) {

      await trx.rollback()

      throw error

    }

  }


  /**
   * ==========================================================================
   * EXISTENCE
   * ==========================================================================
   */
  async exists(
    id: number
  ) {

    return !!(
      await EcoleUser
        .query()
        .where(
          'user_id',
          id
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )
        .first()
    )

  }


  /**
   * ==========================================================================
   * ADMINISTRATEUR
   * ==========================================================================
   */
  private async findAdmin(
    id: number
  ) {

    const membership =
      await EcoleUser
        .query()
        .where(
          'user_id',
          id
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )
        .first()


    if (!membership) {

      throw new Error(
        'Administrateur introuvable.'
      )

    }


    const user =
      await User.find(id)


    if (!user || user.deletedAt) {

      throw new Error(
        'Administrateur introuvable.'
      )

    }


    return user

  }


  /**
   * ==========================================================================
   * SERIALISER
   * ==========================================================================
   */
  private async serializeUser(
    user: User
  ) {

    const memberships =
      await EcoleUser
        .query()
        .where(
          'user_id',
          user.id
        )
        .where(
          'role',
          'ADMIN_ECOLE'
        )


    const schoolIds =
      memberships.map(
        membership =>
          membership.ecoleId
      )


    const schools =
      schoolIds.length
        ? await Ecole
            .query()
            .whereIn(
              'id',
              schoolIds
            )
        : []


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

      statut:
        user.statut,

      systemRole:
        user.systemRole,

      isVerified:
        user.isVerified,

      createdAt:
        user.createdAt,

      lastLoginAt:
        user.lastLoginAt,

      ecoles:
        schools.map(
          school => {

            const membership =
              memberships.find(
                item =>
                  item.ecoleId ===
                  school.id
              )


            return {

              id:
                school.id,

              nom:
                school.nom,

              code:
                school.code,

              statut:
                school.statut,

              role:
                membership?.role,

              membershipStatus:
                membership?.statut,

            }

          }
        ),

    }

  }


  /**
   * ==========================================================================
   * HELPERS
   * ==========================================================================
   */

  private normalizeEmail(
    value: unknown
  ) {

    if (
      value === undefined ||
      value === null
    ) {

      return null

    }


    const email =
      String(value)
        .trim()
        .toLowerCase()


    return email || null

  }


  private normalizeValue(
    value: unknown
  ) {

    if (
      value === undefined ||
      value === null
    ) {

      return null

    }


    const valueString =
      String(value).trim()


    return valueString || null

  }

}