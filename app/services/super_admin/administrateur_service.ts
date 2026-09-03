import crypto from 'node:crypto'

import db from '@adonisjs/lucid/services/db'
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
   * CRÉER / ASSOCIER UN ADMINISTRATEUR
   * ==========================================================================
   *
   * Deux modes sont supportés :
   *
   * 1. mode = "new"
   *    Création d'un nouveau compte utilisateur puis association à l'école.
   *
   * 2. mode = "existing"
   *    Utilisation d'un compte utilisateur déjà existant.
   *
   * Règles importantes :
   *
   * - Un utilisateur existant n'est jamais recréé.
   * - Le systemRole de l'utilisateur n'est jamais modifié ici.
   * - Un SUPER_ADMIN peut également être ADMIN_ECOLE.
   * - L'appartenance est propre à l'école.
   * - Une appartenance ADMIN_ECOLE existante et inactive est réactivée.
   * - Une appartenance ADMIN_ECOLE active existante provoque une erreur.
   * - Le contexte actif n'est pas changé arbitrairement pour un utilisateur
   *   existant qui possède déjà une autre école active.
   */
  async create(
    ecoleId: number,
    payload: any
  ) {
    const trx =
      await db.transaction()

    try {
      /**
       * ----------------------------------------------------------------------
       * Vérifier l'école
       * ----------------------------------------------------------------------
       */
      const school =
        await Ecole
          .query({ client: trx })
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
        school.statut !==
        'ACTIF'
      ) {
        throw new Error(
          "Impossible d'ajouter un administrateur à une école qui n'est pas active."
        )
      }

      const mode =
        payload.mode === 'existing'
          ? 'existing'
          : 'new'

      /**
       * =========================================================================
       * MODE EXISTING
       * =========================================================================
       */
      if (
        mode === 'existing'
      ) {
        const userId =
          Number(payload.userId)

        if (
          !Number.isInteger(userId) ||
          userId <= 0
        ) {
          throw new Error(
            "L'identifiant de l'utilisateur est invalide."
          )
        }

        /**
         * ---------------------------------------------------------------
         * Récupérer l'utilisateur existant
         * ---------------------------------------------------------------
         *
         * Aucun filtre sur systemRole :
         *
         * - USER
         * - SUPER_ADMIN
         *
         * sont tous deux valides.
         *
         * Aucun filtre sur l'appartenance à d'autres écoles :
         * un utilisateur peut être membre de plusieurs écoles.
         */
        const user =
          await User
            .query({ client: trx })
            .where(
              'id',
              userId
            )
            .whereNull(
              'deleted_at'
            )
            .first()

        if (!user) {
          throw new Error(
            "L'utilisateur sélectionné n'existe pas."
          )
        }

        /**
         * Un compte supprimé ne devrait jamais pouvoir être réassocié.
         */
        if (
          user.statut ===
          'SUPPRIME'
        ) {
          throw new Error(
            "Impossible d'associer un utilisateur dont le compte a été supprimé."
          )
        }

        /**
         * ---------------------------------------------------------------
         * Vérifier l'appartenance ADMIN_ECOLE dans CETTE école
         * ---------------------------------------------------------------
         *
         * Une appartenance dans une autre école n'est pas un doublon.
         */
        let membership =
          await EcoleUser
            .query({ client: trx })
            .where(
              'user_id',
              user.id
            )
            .where(
              'ecole_id',
              ecoleId
            )
            .where(
              'role',
              'ADMIN_ECOLE'
            )
            .first()

        if (membership) {
          /**
           * L'utilisateur est déjà administrateur actif de cette école.
           */
          if (
            membership.statut ===
            'ACTIF'
          ) {
            throw new Error(
              'Cet utilisateur est déjà administrateur de cette école.'
            )
          }

          /**
           * Une ancienne appartenance inactive est réactivée.
           */
          membership.statut =
            'ACTIF'

          membership.useTransaction(
            trx
          )

          await membership.save()
        } else {
          /**
           * Créer une nouvelle appartenance pour cette école.
           */
          membership =
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
        }

        /**
         * ---------------------------------------------------------------
         * Contexte scolaire
         * ---------------------------------------------------------------
         *
         * Le contexte représente l'école actuellement sélectionnée.
         *
         * Nous ne devons PAS déplacer silencieusement l'utilisateur vers
         * cette nouvelle école s'il possède déjà un contexte actif.
         *
         * Exemple :
         *
         * École A -> TEACHER -> contexte actif
         * École B -> ADMIN_ECOLE -> association créée
         *
         * L'utilisateur reste dans École A jusqu'à ce qu'il appelle
         * explicitement switchSchool().
         */
        const activeContext =
          await UserContext
            .query({ client: trx })
            .where(
              'user_id',
              user.id
            )
            .where(
              'active',
              true
            )
            .first()

        if (!activeContext) {
          const context =
            new UserContext()

          context.useTransaction(
            trx
          )

          context.merge({
            userId:
              user.id,

            ecoleId,

            role:
              'ADMIN_ECOLE',

            active:
              true,
          })

          await context.save()
        } else if (
          Number(activeContext.ecoleId) ===
          Number(ecoleId)
        ) {
          /**
           * Le contexte pointe déjà vers la bonne école.
           *
           * Son rôle est resynchronisé au cas où il aurait été modifié.
           */
          activeContext.role =
            'ADMIN_ECOLE'

          activeContext.active =
            true

          activeContext.useTransaction(
            trx
          )

          await activeContext.save()
        }

        await trx.commit()

        return {
          success:
            true,

          message:
            "Administrateur d'école associé avec succès.",

          data:
            await this.serializeUser(
              user
            ),
        }
      }

      /**
       * =========================================================================
       * MODE NEW
       * =========================================================================
       */

      const email =
        this.normalizeEmail(
          payload.email
        )

      if (!email) {
        throw new Error(
          "L'adresse email est obligatoire."
        )
      }

      /**
       * ----------------------------------------------------------------------
       * Vérification email
       * ----------------------------------------------------------------------
       */
      const emailExists =
        await User
          .query({ client: trx })
          .where(
            'email',
            email
          )
          .first()

      if (emailExists) {
        throw new Error(
          'Cette adresse email existe déjà. Utilisez plutôt le mode utilisateur existant.'
        )
      }

      const pseudo =
  this.normalizeValue(
    payload.pseudo
  )

if (pseudo) {

  const pseudoExists =
    await User
      .query({
        client: trx,
      })
      .where(
        'pseudo',
        pseudo
      )
      .whereNull(
        'deleted_at'
      )
      .first()

  if (pseudoExists) {
    throw new Error(
      'Ce pseudo est déjà utilisé. Veuillez en choisir un autre.'
    )
  }
}

      /**
       * ----------------------------------------------------------------------
       * Vérification téléphone
       * ----------------------------------------------------------------------
       */
      const telephone =
        this.normalizeValue(
          payload.telephone
        )

      if (telephone) {
        const phoneExists =
          await User
            .query({ client: trx })
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

      /**
       * ----------------------------------------------------------------------
       * Vérification mot de passe
       * ----------------------------------------------------------------------
       */
      if (
        !payload.password ||
        String(payload.password).length < 8
      ) {
        throw new Error(
          'Le mot de passe doit contenir au moins 8 caractères.'
        )
      }

      /**
       * ----------------------------------------------------------------------
       * Token de vérification
       * ----------------------------------------------------------------------
       */
      const verificationToken =
        crypto
          .randomBytes(32)
          .toString('hex')

      /**
       * ----------------------------------------------------------------------
       * Création utilisateur
       * ----------------------------------------------------------------------
       *
       * IMPORTANT :
       *
       * Le mot de passe est fourni en clair au modèle.
       * Le modèle User se charge du hash avec son mécanisme de sauvegarde.
       */
      const user =
        new User()

      user.useTransaction(
        trx
      )

      user.merge({
        nom:
          payload.nom,

        postnom:
          payload.postnom ??
          null,

        prenom:
          payload.prenom,

        pseudo:
          payload.pseudo ??
          null,

        email,

        telephone,

        sexe:
          payload.sexe ??
          null,

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
          DateTime
            .now()
            .plus({
              hours: 24,
            }),
      })

      await user.save()

      /**
       * ----------------------------------------------------------------------
       * Appartenance scolaire
       * ----------------------------------------------------------------------
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
       * ----------------------------------------------------------------------
       * Contexte scolaire
       * ----------------------------------------------------------------------
       *
       * Le comportement historique est conservé pour un nouveau compte :
       * l'école créée devient son contexte actif.
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
          active:
            false,
        })

      const context =
        new UserContext()

      context.useTransaction(
        trx
      )

      context.merge({
        userId:
          user.id,

        ecoleId,

        role:
          'ADMIN_ECOLE',

        active:
          true,
      })

      await context.save()

      await trx.commit()

      /**
       * ----------------------------------------------------------------------
       * Email de vérification
       * ----------------------------------------------------------------------
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
   * RECHERCHE D'UTILISATEURS
   * ==========================================================================
   *
   * Cette méthode est utilisée par le sélecteur d'utilisateur existant.
   *
   * IMPORTANT :
   *
   * La recherche est globale.
   *
   * On ne filtre PAS :
   *
   * - par systemRole ;
   * - par appartenance à une école ;
   * - par rôle actuel.
   *
   * Un utilisateur déjà membre d'une autre école doit pouvoir être trouvé.
   *
   * ecoleId est conservé comme paramètre optionnel pour compatibilité avec
   * certaines anciennes utilisations, mais la recherche globale est le
   * comportement par défaut.
   */
  async searchUsers(
    keyword = '',
    ecoleId?: number,
    limit = 10
  ) {
    const value =
      String(keyword)
        .trim()

    if (!value) {
      return {
        success:
          true,

        data:
          [],
      }
    }

    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) ||
            10,
          1
        ),
        50
      )

    const search =
      `%${value}%`

    const query =
      User
        .query()
        .whereNull(
          'deleted_at'
        )
        .where(
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
        .orderBy(
          'nom',
          'asc'
        )
        .orderBy(
          'prenom',
          'asc'
        )
        .limit(
          safeLimit
        )

    /**
     * Le paramètre ecoleId n'est volontairement pas utilisé pour filtrer
     * la recherche principale.
     *
     * Un utilisateur qui appartient déjà à une autre école doit rester
     * sélectionnable.
     */
    void ecoleId

    const users =
      await query

    return {
      success:
        true,

      data:
        users.map(
          (user) => ({
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

            statut:
              user.statut,

            systemRole:
              user.systemRole,
          })
        ),
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
      await this.findAdmin(
        id
      )

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

    /**
     * ----------------------------------------------------------------------
     * Vérification email
     * ----------------------------------------------------------------------
     */
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

    /**
     * ----------------------------------------------------------------------
     * Vérification téléphone
     * ----------------------------------------------------------------------
     */
    if (
      telephone &&
      telephone !==
        user.telephone
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
        payload.postnom !==
        undefined
          ? payload.postnom
          : user.postnom,

      prenom:
        payload.prenom ??
        user.prenom,

      pseudo:
        payload.pseudo !==
        undefined
          ? payload.pseudo
          : user.pseudo,

      email:
        email ??
        undefined,

      telephone,

      sexe:
        payload.sexe !==
        undefined
          ? payload.sexe
          : user.sexe,

      statut:
        payload.statut ??
        user.statut,
    })

    /**
     * ----------------------------------------------------------------------
     * Mot de passe
     * ----------------------------------------------------------------------
     */
    if (
      payload.password
    ) {
      if (
        String(
          payload.password
        ).length < 8
      ) {
        throw new Error(
          'Le nouveau mot de passe doit contenir au moins 8 caractères.'
        )
      }

      /**
       * Le modèle User effectue le hash.
       */
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
   *
   * Le comportement global existant est conservé :
   * suspendre un administrateur suspend son compte et ses appartenances
   * administrateur actives.
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
        Number(page) ||
          1
      )

    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) ||
            10,
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
            builder.wherePivot(
              'role',
              'ADMIN_ECOLE'
            )
          }
        )

    /**
     * ----------------------------------------------------------------------
     * Recherche
     * ----------------------------------------------------------------------
     */
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

    /**
     * ----------------------------------------------------------------------
     * Statut
     * ----------------------------------------------------------------------
     */
    if (
      filters.statut
    ) {
      query.where(
        'statut',
        filters.statut
      )
    }

    /**
     * ----------------------------------------------------------------------
     * École
     * ----------------------------------------------------------------------
     */
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

    /**
     * ----------------------------------------------------------------------
     * Tri
     * ----------------------------------------------------------------------
     */
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

    /**
     * ----------------------------------------------------------------------
     * Appartenances scolaires
     * ----------------------------------------------------------------------
     */
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
            (user) =>
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
        (membership) =>
          membership.userId
      )

    if (
      !userIds.length
    ) {
      return {
        success:
          true,

        data:
          [],
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
            (user) =>
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
          (builder) =>
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
    ] =
      await Promise.all([
        base.clone()
          .count(
            '* as total'
          ),

        base.clone()
          .where(
            'statut',
            'ACTIF'
          )
          .count(
            '* as total'
          ),

        base.clone()
          .where(
            'statut',
            'INACTIF'
          )
          .count(
            '* as total'
          ),

        User
          .query()
          .where(
            'statut',
            'SUPPRIME'
          )
          .count(
            '* as total'
          ),

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
          .count(
            '* as total'
          ),

        base.clone()
          .whereNull(
            'last_login_at'
          )
          .count(
            '* as total'
          ),
      ])

    const totalCount =
      Number(
        total[0].$extras
          .total
      )

    const activeCount =
      Number(
        actifs[0].$extras
          .total
      )

    const newCount =
      Number(
        nouveaux[0].$extras
          .total
      )

    const neverLoginCount =
      Number(
        jamaisConnectes[0].$extras
          .total
      )

    return {
      total:
        totalCount,

      actifs:
        activeCount,

      inactifs:
        Number(
          inactifs[0].$extras
            .total
        ),

      supprimes:
        Number(
          supprimés[0].$extras
            .total
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
                totalCount *
                100
              ).toFixed(
                1
              )
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
              ).toFixed(
                1
              )
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
        (membership) =>
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
            (school) => {
              const membership =
                memberships.find(
                  (item) =>
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
   *
   * Cette méthode concerne spécifiquement l'espace de gestion des
   * administrateurs d'école.
   *
   * Elle vérifie donc que l'utilisateur possède le rôle ADMIN_ECOLE dans
   * l'école cible.
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

    const school =
      await Ecole.find(
        ecoleId
      )

    if (!school) {
      throw new Error(
        "L'école sélectionnée est introuvable."
      )
    }

    if (
      school.statut !==
      'ACTIF'
    ) {
      throw new Error(
        "Cette école n'est pas active actuellement."
      )
    }

    const trx =
      await db.transaction()

    try {
      /**
       * ----------------------------------------------------------------------
       * Désactiver tous les contextes
       * ----------------------------------------------------------------------
       */
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

      /**
       * ----------------------------------------------------------------------
       * Réutiliser ou créer le contexte
       * ----------------------------------------------------------------------
       */
      let context =
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

        context.role =
          membership.role

        context.active =
          true

        await context.save()
      } else {
        context =
          new UserContext()

        context.useTransaction(
          trx
        )

        context.merge({
          userId,

          ecoleId,

          role:
            membership.role,

          active:
            true,
        })

        await context.save()
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
      await User.find(
        id
      )

    if (
      !user ||
      user.deletedAt
    ) {
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
        (membership) =>
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
          (school) => {
            const membership =
              memberships.find(
                (item) =>
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

    return (
      email ||
      null
    )
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
      String(value)
        .trim()

    return (
      valueString ||
      null
    )
  }
}