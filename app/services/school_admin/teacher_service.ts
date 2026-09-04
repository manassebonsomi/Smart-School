import db from '@adonisjs/lucid/services/db'

import User from '#models/user'
import EcoleUser from '#models/ecole_user'
import UserContext from '#models/user_context'

export default class TeacherService {
  /**
   * --------------------------------------------------------------------------
   * CONTEXTE ADMINISTRATEUR
   * --------------------------------------------------------------------------
   */
  private async getContext(userId: number) {
    const context = await UserContext
      .query()
      .where('user_id', userId)
      .where('active', true)
      .preload('ecole')
      .first()

    if (!context || !context.ecole) {
      throw new Error(
        'Aucune école active n’est disponible pour cet utilisateur.'
      )
    }

    if (context.ecole.statut !== 'ACTIF') {
      throw new Error(
        'L’école actuellement sélectionnée n’est pas active.'
      )
    }

    if (context.role !== 'ADMIN_ECOLE') {
      throw new Error(
        'Accès réservé à l’administrateur de l’école.'
      )
    }

    return context
  }

  /**
   * --------------------------------------------------------------------------
   * NOM COMPLET
   * --------------------------------------------------------------------------
   */
  private formatFullName(user: User) {
    return [
      user.prenom,
      user.postnom,
      user.nom,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * --------------------------------------------------------------------------
   * SÉRIALISATION
   * --------------------------------------------------------------------------
   */
  private serializeTeacher(
    membership: EcoleUser,
    user: User
  ) {
    return {
      id: membership.id,

      membershipId: membership.id,

      userId: user.id,

      prenom: user.prenom,

      postnom: user.postnom,

      nom: user.nom,

      fullName:
        this.formatFullName(user) ||
        user.pseudo ||
        user.email ||
        'Enseignant',

      pseudo: user.pseudo,

      email: user.email,

      telephone: user.telephone,

      sexe: user.sexe,

      bio: user.bio,

      address: user.address,

      avatarUrl: user.avatarUrl,

      userStatus: user.statut,

      membershipStatus: membership.statut,

      statut: membership.statut,

      role: membership.role,

      createdAt: membership.createdAt,

      updatedAt: membership.updatedAt,

      lastLoginAt: user.lastLoginAt,
    }
  }

  /**
   * --------------------------------------------------------------------------
   * CHARGER UN UTILISATEUR
   * --------------------------------------------------------------------------
   *
   * On récupère directement le User à partir du user_id présent dans
   * ecole_users. Cela évite de dépendre du preload de la relation.
   * --------------------------------------------------------------------------
   */
  private async findUserById(
    userId: number
  ) {
    return User
      .query()
      .where(
        'id',
        userId
      )
      .whereNull(
        'deleted_at'
      )
      .first()
  }

  /**
   * --------------------------------------------------------------------------
   * RECHERCHE D'UTILISATEURS
   * --------------------------------------------------------------------------
   *
   * Recherche volontairement globale :
   *
   * - aucun filtre systemRole
   * - aucun filtre école
   * - aucun filtre sur l'appartenance existante
   *
   * La compatibilité avec l'école est vérifiée au moment de l'association.
   * --------------------------------------------------------------------------
   */
  async searchUsers(
    userId: number,
    keyword: string,
    limit = 10
  ) {
    await this.getContext(
      userId
    )

    const value =
      String(
        keyword || ''
      ).trim()

    if (value.length < 2) {
      return {
        success: true,
        data: [],
      }
    }

    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) || 10,
          1
        ),
        20
      )

    const term =
      `%${value}%`

    const users =
      await User
        .query()
        .whereNull(
          'deleted_at'
        )
        .where((query) => {
          query
            .whereILike(
              'nom',
              term
            )
            .orWhereILike(
              'postnom',
              term
            )
            .orWhereILike(
              'prenom',
              term
            )
            .orWhereILike(
              'email',
              term
            )
            .orWhereILike(
              'telephone',
              term
            )
            .orWhereILike(
              'pseudo',
              term
            )
        })
        .select([
          'id',
          'prenom',
          'postnom',
          'nom',
          'pseudo',
          'email',
          'telephone',
          'sexe',
          'statut',
        ])
        .orderBy(
          'prenom',
          'asc'
        )
        .limit(
          safeLimit
        )

    return {
      success: true,

      data:
        users.map(
          (user) => ({
            id:
              user.id,

            prenom:
              user.prenom,

            postnom:
              user.postnom,

            nom:
              user.nom,

            fullName:
              this.formatFullName(
                user
              ) ||
              user.pseudo ||
              user.email ||
              'Utilisateur',

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
          })
        ),
    }
  }

  /**
   * --------------------------------------------------------------------------
   * LISTE
   * --------------------------------------------------------------------------
   */
  async list(
    userId: number,
    options: {
      page?: number
      limit?: number
      search?: string
      statut?: string
    } = {}
  ) {
    const context =
      await this.getContext(
        userId
      )

    const page =
      Math.max(
        Number(
          options.page || 1
        ),
        1
      )

    const limit =
      Math.min(
        Math.max(
          Number(
            options.limit || 10
          ),
          1
        ),
        100
      )

    const search =
      String(
        options.search || ''
      ).trim()

    const statut =
      String(
        options.statut || ''
      ).trim()

    /**
     * ------------------------------------------------------------------------
     * QUERY DES ASSOCIATIONS
     * ------------------------------------------------------------------------
     */
    const query =
      EcoleUser
        .query()
        .where(
          'ecole_id',
          context.ecoleId
        )
        .where(
          'role',
          'ENSEIGNANT'
        )
        .orderBy(
          'created_at',
          'desc'
        )

    /**
     * Filtre statut.
     */
    if (
      statut &&
      [
        'ACTIF',
        'INACTIF',
      ].includes(
        statut
      )
    ) {
      query.where(
        'statut',
        statut
      )
    }

    /**
     * Recherche.
     *
     * Ici nous utilisons whereHas afin que la recherche puisse
     * se faire sur les champs du User associé.
     */
    if (search) {
      const term =
        `%${search}%`

      query.whereHas(
        'utilisateur',
        (userQuery) => {
          userQuery
            .whereILike(
              'nom',
              term
            )
            .orWhereILike(
              'postnom',
              term
            )
            .orWhereILike(
              'prenom',
              term
            )
            .orWhereILike(
              'email',
              term
            )
            .orWhereILike(
              'telephone',
              term
            )
            .orWhereILike(
              'pseudo',
              term
            )
        }
      )
    }

    /**
     * Pagination.
     */
    const result =
      await query.paginate(
        page,
        limit
      )

    const memberships =
      result.all()

    /**
     * ------------------------------------------------------------------------
     * CHARGEMENT DIRECT DES USERS
     * ------------------------------------------------------------------------
     *
     * On ne dépend plus de membership.utilisateur.
     */
    const userIds =
      memberships
        .map(
          (membership) =>
            Number(
              membership.userId
            )
        )
        .filter(
          (id) =>
            Number.isInteger(
              id
            ) &&
            id > 0
        )

    const users =
      userIds.length
        ? await User
            .query()
            .whereIn(
              'id',
              userIds
            )
            .whereNull(
              'deleted_at'
            )
        : []

    /**
     * Map User par ID pour accès rapide.
     */
    const usersById =
      new Map(
        users.map(
          (user) => [
            Number(user.id),
            user,
          ]
        )
      )

    /**
     * Construction finale.
     */
    const data =
      memberships
        .map(
          (membership) => {
            const user =
              usersById.get(
                Number(
                  membership.userId
                )
              )

            /**
             * Si aucune correspondance n'existe,
             * on ignore uniquement cette ligne.
             */
            if (!user) {
              return null
            }

            return this.serializeTeacher(
              membership,
              user
            )
          }
        )
        .filter(
          (
            teacher
          ): teacher is NonNullable<
            ReturnType<
              TeacherService['serializeTeacher']
            >
          > =>
            teacher !== null
        )

    return {
      success: true,

      data: {
        meta:
          result.getMeta(),

        data,
      },
    }
  }

  /**
   * --------------------------------------------------------------------------
   * STATISTIQUES
   * --------------------------------------------------------------------------
   */
  async statistics(
    userId: number
  ) {
    const context =
      await this.getContext(
        userId
      )

    const base =
      EcoleUser
        .query()
        .where(
          'ecole_id',
          context.ecoleId
        )
        .where(
          'role',
          'ENSEIGNANT'
        )

    const [
      total,
      actifs,
      inactifs,
    ] =
      await Promise.all([
        base
          .clone()
          .count(
            '* as total'
          ),

        base
          .clone()
          .where(
            'statut',
            'ACTIF'
          )
          .count(
            '* as total'
          ),

        base
          .clone()
          .where(
            'statut',
            'INACTIF'
          )
          .count(
            '* as total'
          ),
      ])

    return {
      success: true,

      data: {
        total:
          Number(
            total[0].$extras.total ||
              0
          ),

        actifs:
          Number(
            actifs[0].$extras.total ||
              0
          ),

        inactifs:
          Number(
            inactifs[0].$extras.total ||
              0
          ),
      },
    }
  }

  /**
   * --------------------------------------------------------------------------
   * DÉTAILS
   * --------------------------------------------------------------------------
   */
  async find(
    userId: number,
    membershipId: number
  ) {
    const context =
      await this.getContext(
        userId
      )

    const membership =
      await EcoleUser
        .query()
        .where(
          'id',
          membershipId
        )
        .where(
          'ecole_id',
          context.ecoleId
        )
        .where(
          'role',
          'ENSEIGNANT'
        )
        .first()

    if (!membership) {
      throw new Error(
        'Cet enseignant n’existe pas dans votre établissement.'
      )
    }

    const user =
      await this.findUserById(
        membership.userId
      )

    if (!user) {
      throw new Error(
        'L’utilisateur associé à cet enseignant est introuvable.'
      )
    }

    return {
      success: true,

      data:
        this.serializeTeacher(
          membership,
          user
        ),
    }
  }

  /**
   * --------------------------------------------------------------------------
   * CRÉATION / ASSOCIATION
   * --------------------------------------------------------------------------
   */
  async create(
    userId: number,
    payload: any
  ) {
    const context =
      await this.getContext(
        userId
      )

    const mode =
      String(
        payload?.mode || 'new'
      ).trim()

    if (
      ![
        'new',
        'existing',
      ].includes(
        mode
      )
    ) {
      throw new Error(
        'Mode de création invalide.'
      )
    }

    const trx =
      await db.transaction()

    try {
      /**
       * ----------------------------------------------------------------------
       * UTILISATEUR EXISTANT
       * ----------------------------------------------------------------------
       */
      if (
        mode ===
        'existing'
      ) {
        const existingUserId =
          Number(
            payload?.userId || 0
          )

        if (!existingUserId) {
          throw new Error(
            'Veuillez sélectionner un utilisateur.'
          )
        }

        const existingUser =
          await User
            .query({
              client: trx,
            })
            .where(
              'id',
              existingUserId
            )
            .whereNull(
              'deleted_at'
            )
            .first()

        if (!existingUser) {
          throw new Error(
            'Cet utilisateur n’existe pas ou n’est plus disponible.'
          )
        }

        /**
         * Vérifie l'association dans cette école.
         */
        const existingMembership =
          await EcoleUser
            .query({
              client: trx,
            })
            .where(
              'user_id',
              existingUser.id
            )
            .where(
              'ecole_id',
              context.ecoleId
            )
            .first()

        if (
          existingMembership
        ) {
          /**
           * Déjà enseignant.
           */
          if (
            existingMembership.role ===
            'ENSEIGNANT'
          ) {
            if (
              existingMembership.statut ===
              'ACTIF'
            ) {
              throw new Error(
                'Cet utilisateur est déjà enseignant actif dans cette école.'
              )
            }

            existingMembership.statut =
              'ACTIF'

            await existingMembership.save()

            const membershipId =
              existingMembership.id

            await trx.commit()

            return {
              success: true,

              message:
                'L’enseignant a été réactivé dans cet établissement.',

              data:
                (
                  await this.find(
                    userId,
                    membershipId
                  )
                ).data,
            }
          }

          /**
           * Un autre rôle existe déjà dans cette école.
           */
          throw new Error(
            `Cet utilisateur est déjà associé à cette école avec le rôle ${existingMembership.role}.`
          )
        }

        /**
         * Nouvelle association.
         */
        const membership =
          new EcoleUser()

        membership.useTransaction(
          trx
        )

        membership.merge({
          userId:
            existingUser.id,

          ecoleId:
            context.ecoleId,

          role:
            'ENSEIGNANT',

          statut:
            'ACTIF',
        })

        await membership.save()

        const membershipId =
          membership.id

        await trx.commit()

        return {
          success: true,

          message:
            'L’utilisateur a été associé comme enseignant.',

          data: {
            id:
              membershipId,

            membershipId:
              membershipId,

            userId:
              existingUser.id,

            prenom:
              existingUser.prenom,

            postnom:
              existingUser.postnom,

            nom:
              existingUser.nom,

            fullName:
              this.formatFullName(
                existingUser
              ) ||
              existingUser.pseudo ||
              existingUser.email ||
              'Enseignant',

            pseudo:
              existingUser.pseudo,

            email:
              existingUser.email,

            telephone:
              existingUser.telephone,

            sexe:
              existingUser.sexe,

            statut:
              'ACTIF',

            role:
              'ENSEIGNANT',
          },
        }
      }

      /**
       * ----------------------------------------------------------------------
       * NOUVEL ENSEIGNANT
       * ----------------------------------------------------------------------
       */

      const prenom =
        String(
          payload?.prenom || ''
        ).trim()

      const nom =
        String(
          payload?.nom || ''
        ).trim()

      const postnom =
        payload?.postnom !==
        undefined
          ? String(
              payload.postnom || ''
            ).trim()
          : ''

      const pseudo =
        payload?.pseudo !==
        undefined
          ? String(
              payload.pseudo || ''
            ).trim() || null
          : null

      const email =
        String(
          payload?.email || ''
        )
          .trim()
          .toLowerCase()

      const telephone =
        payload?.telephone !==
        undefined
          ? String(
              payload.telephone || ''
            ).trim() || null
          : null

      const rawSexe =
        String(
          payload?.sexe || ''
        )
          .trim()
          .toUpperCase()

      const sexe =
        rawSexe === ''
          ? null
          : [
              'HOMME',
              'FEMME',
              'AUTRE',
            ].includes(
              rawSexe
            )
            ? rawSexe
            : null

      const password =
        String(
          payload?.password || ''
        )

      if (!prenom) {
        throw new Error(
          'Le prénom est obligatoire.'
        )
      }

      if (!nom) {
        throw new Error(
          'Le nom est obligatoire.'
        )
      }

      if (!email) {
        throw new Error(
          'L’adresse e-mail est obligatoire.'
        )
      }

      if (
        !password ||
        password.length < 8
      ) {
        throw new Error(
          'Le mot de passe doit contenir au moins 8 caractères.'
        )
      }

      if (
        rawSexe &&
        ![
          'HOMME',
          'FEMME',
          'AUTRE',
        ].includes(
          rawSexe
        )
      ) {
        throw new Error(
          'La valeur du sexe est invalide. Utilisez HOMME, FEMME ou AUTRE.'
        )
      }

      /**
       * Unicité e-mail.
       */
      const emailExists =
        await User
          .query({
            client: trx,
          })
          .where(
            'email',
            email
          )
          .whereNull(
            'deleted_at'
          )
          .first()

      if (emailExists) {
        throw new Error(
          'Cette adresse e-mail est déjà utilisée.'
        )
      }

      /**
       * Unicité téléphone.
       */
      if (telephone) {
        const telephoneExists =
          await User
            .query({
              client: trx,
            })
            .where(
              'telephone',
              telephone
            )
            .whereNull(
              'deleted_at'
            )
            .first()

        if (telephoneExists) {
          throw new Error(
            'Ce numéro de téléphone est déjà utilisé.'
          )
        }
      }

      /**
       * Création du User.
       */
      const teacher =
        new User()

      teacher.useTransaction(
        trx
      )

      teacher.merge({
        prenom,
        nom,
        postnom,
        pseudo,
        email,
        telephone,
        sexe,
        statut:
          'ACTIF',
        isVerified:
          true,
      })

      /**
       * Le modèle User/AuthFinder s'occupe du hash.
       */
      teacher.password =
        password

      await teacher.save()

      /**
       * Association avec l'école.
       */
      const membership =
        new EcoleUser()

      membership.useTransaction(
        trx
      )

      membership.merge({
        userId:
          teacher.id,

        ecoleId:
          context.ecoleId,

        role:
          'ENSEIGNANT',

        statut:
          'ACTIF',
      })

      await membership.save()

      await trx.commit()

      return {
        success: true,

        message:
          'Enseignant créé avec succès.',

        data: {
          id:
            membership.id,

          membershipId:
            membership.id,

          userId:
            teacher.id,

          prenom:
            teacher.prenom,

          postnom:
            teacher.postnom,

          nom:
            teacher.nom,

          fullName:
            this.formatFullName(
              teacher
            ) ||
            teacher.pseudo ||
            teacher.email ||
            'Enseignant',

          pseudo:
            teacher.pseudo,

          email:
            teacher.email,

          telephone:
            teacher.telephone,

          sexe:
            teacher.sexe,

          statut:
            membership.statut,

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
   * --------------------------------------------------------------------------
   * MODIFICATION
   * --------------------------------------------------------------------------
   */
  async update(
    userId: number,
    membershipId: number,
    payload: any
  ) {
    const context =
      await this.getContext(
        userId
      )

    const membership =
      await EcoleUser
        .query()
        .where(
          'id',
          membershipId
        )
        .where(
          'ecole_id',
          context.ecoleId
        )
        .where(
          'role',
          'ENSEIGNANT'
        )
        .first()

    if (!membership) {
      throw new Error(
        'Cet enseignant n’existe pas dans votre établissement.'
      )
    }

    const user =
      await this.findUserById(
        membership.userId
      )

    if (!user) {
      throw new Error(
        'L’utilisateur associé à cet enseignant est introuvable.'
      )
    }

    const prenom =
      payload?.prenom !==
      undefined
        ? String(
            payload.prenom || ''
          ).trim()
        : user.prenom

    const nom =
      payload?.nom !==
      undefined
        ? String(
            payload.nom || ''
          ).trim()
        : user.nom

    const postnom =
      payload?.postnom !==
      undefined
        ? String(
            payload.postnom || ''
          ).trim()
        : user.postnom

    const pseudo =
      payload?.pseudo !==
      undefined
        ? String(
            payload.pseudo || ''
          ).trim() || null
        : user.pseudo

    const email =
      payload?.email !==
      undefined
        ? String(
            payload.email || ''
          )
            .trim()
            .toLowerCase()
        : user.email

    const telephone =
      payload?.telephone !==
      undefined
        ? String(
            payload.telephone || ''
          ).trim() || null
        : user.telephone

    let sexe =
      user.sexe

    if (
      payload?.sexe !==
      undefined
    ) {
      const rawSexe =
        String(
          payload.sexe || ''
        )
          .trim()
          .toUpperCase()

      if (
        rawSexe === ''
      ) {
        sexe = null
      } else if (
        [
          'HOMME',
          'FEMME',
          'AUTRE',
        ].includes(
          rawSexe
        )
      ) {
        sexe = rawSexe
      } else {
        throw new Error(
          'La valeur du sexe est invalide. Utilisez HOMME, FEMME ou AUTRE.'
        )
      }
    }

    if (!prenom) {
      throw new Error(
        'Le prénom est obligatoire.'
      )
    }

    if (!nom) {
      throw new Error(
        'Le nom est obligatoire.'
      )
    }

    if (!email) {
      throw new Error(
        'L’adresse e-mail est obligatoire.'
      )
    }

    /**
     * Vérification e-mail.
     */
    if (
      email !==
      user.email
    ) {
      const emailExists =
        await User
          .query()
          .where(
            'email',
            email
          )
          .where(
            'id',
            '!=',
            user.id
          )
          .whereNull(
            'deleted_at'
          )
          .first()

      if (emailExists) {
        throw new Error(
          'Cette adresse e-mail est déjà utilisée.'
        )
      }
    }

    /**
     * Vérification téléphone.
     */
    if (
      telephone &&
      telephone !==
        user.telephone
    ) {
      const telephoneExists =
        await User
          .query()
          .where(
            'telephone',
            telephone
          )
          .where(
            'id',
            '!=',
            user.id
          )
          .whereNull(
            'deleted_at'
          )
          .first()

      if (telephoneExists) {
        throw new Error(
          'Ce numéro de téléphone est déjà utilisé.'
        )
      }
    }

    user.prenom =
      prenom

    user.nom =
      nom

    user.postnom =
      postnom

    user.pseudo =
      pseudo

    user.email =
      email

    user.telephone =
      telephone

    user.sexe =
      sexe

    /**
     * Mot de passe facultatif.
     */
    if (
      payload?.password !==
      undefined
    ) {
      const password =
        String(
          payload.password || ''
        )

      if (
        password &&
        password.length < 8
      ) {
        throw new Error(
          'Le mot de passe doit contenir au moins 8 caractères.'
        )
      }

      if (password) {
        user.password =
          password
      }
    }

    await user.save()

    return {
      success: true,

      message:
        'Informations de l’enseignant mises à jour.',

      data:
        this.serializeTeacher(
          membership,
          user
        ),
    }
  }

  /**
   * --------------------------------------------------------------------------
   * STATUT
   * --------------------------------------------------------------------------
   */
  async setStatus(
    userId: number,
    membershipId: number,
    statut: string
  ) {
    const context =
      await this.getContext(
        userId
      )

    const normalizedStatus =
      String(
        statut || ''
      )
        .trim()
        .toUpperCase()

    if (
      ![
        'ACTIF',
        'INACTIF',
      ].includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        'Statut invalide.'
      )
    }

    const membership =
      await EcoleUser
        .query()
        .where(
          'id',
          membershipId
        )
        .where(
          'ecole_id',
          context.ecoleId
        )
        .where(
          'role',
          'ENSEIGNANT'
        )
        .first()

    if (!membership) {
      throw new Error(
        'Cet enseignant n’existe pas dans votre établissement.'
      )
    }

    const user =
      await this.findUserById(
        membership.userId
      )

    if (!user) {
      throw new Error(
        'L’utilisateur associé à cet enseignant est introuvable.'
      )
    }

    membership.statut =
      normalizedStatus

    await membership.save()

    return {
      success: true,

      message:
        normalizedStatus ===
        'ACTIF'
          ? 'L’enseignant a été activé.'
          : 'L’enseignant a été désactivé.',

      data:
        this.serializeTeacher(
          membership,
          user
        ),
    }
  }

  /**
   * --------------------------------------------------------------------------
   * RETIRER DE L'ÉCOLE
   * --------------------------------------------------------------------------
   *
   * On supprime uniquement l'association EcoleUser.
   * Le compte User reste dans le système.
   * --------------------------------------------------------------------------
   */
  async remove(
    userId: number,
    membershipId: number
  ) {
    const context =
      await this.getContext(
        userId
      )

    const membership =
      await EcoleUser
        .query()
        .where(
          'id',
          membershipId
        )
        .where(
          'ecole_id',
          context.ecoleId
        )
        .where(
          'role',
          'ENSEIGNANT'
        )
        .first()

    if (!membership) {
      throw new Error(
        'Cet enseignant n’existe pas dans votre établissement.'
      )
    }

    await membership.delete()

    return {
      success: true,

      message:
        'L’enseignant a été retiré de cet établissement.',
    }
  }
}