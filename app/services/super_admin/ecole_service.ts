
import crypto from 'node:crypto'
import { DateTime } from 'luxon'

import db from '@adonisjs/lucid/services/db'
import Ecole from '#models/ecole'
import User from '#models/user'
import EcoleUser from '#models/ecole_user'
import UserContext from '#models/user_context'

import VerifyEmailMail from '#mails/verify_email'

import { SystemRole } from '../../enums/system_role.ts'

export default class EcoleService {
  private verifyEmailMail =
    new VerifyEmailMail()

  /**
   * ==========================================================================
   * CRÉER UNE ÉCOLE
   * ==========================================================================
   *
   * La création d'une école peut être réalisée :
   *
   * - sans administrateur ;
   * - avec un nouvel administrateur ;
   * - avec un utilisateur existant.
   *
   * Règles importantes pour admin.mode = "existing" :
   *
   * - le compte User existant n'est jamais recréé ;
   * - son systemRole n'est jamais modifié ;
   * - un SUPER_ADMIN peut être utilisé comme ADMIN_ECOLE ;
   * - son appartenance à d'autres écoles n'est pas un obstacle ;
   * - une appartenance ADMIN_ECOLE déjà active dans cette école est refusée ;
   * - une ancienne appartenance ADMIN_ECOLE inactive est réactivée ;
   * - le contexte actif existant n'est pas déplacé automatiquement vers la
   *   nouvelle école.
   *
   * Pour admin.mode = "new" :
   *
   * - un nouveau User est créé ;
   * - son compte reste EN ATTENTE ;
   * - un email de vérification est envoyé après commit.
   */
  async create(payload: any) {
    const trx =
      await db.transaction()

    let administrator:
      User | null = null

    let sendVerificationEmail =
      false

    let verificationToken:
      string | null = null

    try {
      /**
       * =========================================================================
       * NORMALISATION DES DONNÉES DE L'ÉCOLE
       * =========================================================================
       */
      const email =
        this.normalizeEmail(
          payload.email
        )

      const telephone =
        this.normalizeValue(
          payload.telephone
        )

      const code =
        this.normalizeValue(
          payload.code
        ) ||
        await this.generateCode()

      /**
       * =========================================================================
       * VÉRIFICATIONS D'UNICITÉ DE L'ÉCOLE
       * =========================================================================
       */
      await this.assertUniqueSchool(
        {
          ...payload,
          code,
          email,
          telephone,
        },
        trx
      )

      /**
       * =========================================================================
       * CRÉATION DE L'ÉCOLE
       * =========================================================================
       */
      const ecole =
        new Ecole()

      ecole.useTransaction(
        trx
      )

      ecole.merge({
        nom:
          this.requiredString(
            payload.nom,
            'Le nom de l’école est obligatoire.'
          ),

        code,

        description:
          payload.description ??
          null,

        email,

        telephone,

        adresse:
          payload.adresse ??
          null,

        ville:
          payload.ville ??
          null,

        pays:
          payload.pays ||
          'République démocratique du Congo',

        province:
          payload.province ??
          null,

        commune:
          payload.commune ??
          null,

        quartier:
          payload.quartier ??
          null,

        siteWeb:
          payload.siteWeb ??
          null,

        type:
          payload.type ??
          null,

        anneeCreation:
          payload.anneeCreation ??
          null,

        logo:
          payload.logo ??
          null,

        statut:
          payload.statut ||
          'ACTIF',
      })

      await ecole.save()

      /**
       * =========================================================================
       * ADMINISTRATEUR DE L'ÉCOLE
       * =========================================================================
       */
      if (
        payload.admin
      ) {
        const admin =
          payload.admin

        const mode =
          admin.mode ===
          'existing'
            ? 'existing'
            : 'new'

        /**
         * =======================================================================
         * ADMINISTRATEUR EXISTANT
         * =======================================================================
         */
        if (
          mode ===
          'existing'
        ) {
          const userId =
            Number(
              admin.userId
            )

          if (
            !Number.isInteger(
              userId
            ) ||
            userId <= 0
          ) {
            throw new Error(
              "L'identifiant de l'utilisateur est invalide."
            )
          }

          /**
           * -------------------------------------------------------------------
           * Récupérer l'utilisateur existant
           * -------------------------------------------------------------------
           *
           * Aucun filtre sur systemRole.
           *
           * Cela autorise notamment :
           *
           * - USER
           * - SUPER_ADMIN
           *
           * Une appartenance à une autre école n'est pas non plus un obstacle.
           */
          const existingUser =
            await User
              .query({
                client:
                  trx,
              })
              .where(
                'id',
                userId
              )
              .whereNull(
                'deleted_at'
              )
              .first()

          if (!existingUser) {
            throw new Error(
              "L'utilisateur sélectionné n'existe pas."
            )
          }

          /**
           * Un compte supprimé ne doit jamais être réutilisé.
           */
          if (
            existingUser.statut ===
            'SUPPRIME'
          ) {
            throw new Error(
              "Impossible d'associer un utilisateur dont le compte a été supprimé."
            )
          }

          /**
           * -------------------------------------------------------------------
           * Vérifier le membership dans CETTE école uniquement
           * -------------------------------------------------------------------
           */
          let existingMembership =
            await EcoleUser
              .query({
                client:
                  trx,
              })
              .where(
                'user_id',
                existingUser.id
              )
              .where(
                'ecole_id',
                ecole.id
              )
              .where(
                'role',
                'ADMIN_ECOLE'
              )
              .first()

          if (
            existingMembership
          ) {
            /**
             * Même utilisateur + même école + même rôle + statut actif :
             * doublon métier.
             */
            if (
              existingMembership.statut ===
              'ACTIF'
            ) {
              throw new Error(
                'Cet utilisateur est déjà administrateur de cette école.'
              )
            }

            /**
             * Ancienne appartenance inactive :
             * on la réactive au lieu de créer un doublon.
             */
            existingMembership.statut =
              'ACTIF'

            existingMembership.useTransaction(
              trx
            )

            await existingMembership.save()
          } else {
            /**
             * Nouvelle appartenance ADMIN_ECOLE.
             */
            existingMembership =
              new EcoleUser()

            existingMembership.useTransaction(
              trx
            )

            existingMembership.merge({
              userId:
                existingUser.id,

              ecoleId:
                ecole.id,

              role:
                'ADMIN_ECOLE',

              statut:
                'ACTIF',
            })

            await existingMembership.save()
          }

          administrator =
            existingUser

          /**
           * -------------------------------------------------------------------
           * UserContext
           * -------------------------------------------------------------------
           *
           * Le contexte représente l'école actuellement sélectionnée.
           *
           * Cas 1 :
           * aucun contexte actif => cette école peut devenir le contexte actif.
           *
           * Cas 2 :
           * contexte actif sur une autre école => on ne le remplace pas.
           *
           * Cas 3 :
           * contexte actif déjà sur cette école => on resynchronise le rôle.
           */
          const activeContext =
            await UserContext
              .query({
                client:
                  trx,
              })
              .where(
                'user_id',
                existingUser.id
              )
              .where(
                'active',
                true
              )
              .first()

          if (
            !activeContext
          ) {
            const context =
              new UserContext()

            context.useTransaction(
              trx
            )

            context.merge({
              userId:
                existingUser.id,

              ecoleId:
                ecole.id,

              role:
                'ADMIN_ECOLE',

              active:
                true,
            })

            await context.save()
          } else if (
            Number(
              activeContext.ecoleId
            ) ===
            Number(
              ecole.id
            )
          ) {
            /**
             * Le contexte pointe déjà vers cette école.
             */
            activeContext.useTransaction(
              trx
            )

            activeContext.role =
              'ADMIN_ECOLE'

            activeContext.active =
              true

            await activeContext.save()
          }

          /**
           * Aucun email de vérification n'est envoyé pour un utilisateur
           * existant.
           */
          sendVerificationEmail =
            false
        }

        /**
         * =======================================================================
         * NOUVEL ADMINISTRATEUR
         * =======================================================================
         */
        else {
          /**
           * -------------------------------------------------------------------
           * Email
           * -------------------------------------------------------------------
           */
          const adminEmail =
            this.requiredEmail(
              admin.email,
              "L’adresse email de l’administrateur est obligatoire."
            )

          /**
           * -------------------------------------------------------------------
           * Vérifier si l'email existe déjà
           * -------------------------------------------------------------------
           */
          const emailExists =
            await User
              .query({
                client:
                  trx,
              })
              .where(
                'email',
                adminEmail
              )
              .first()

          if (
            emailExists
          ) {
            throw new Error(
              "L’adresse email de l’administrateur existe déjà. Utilisez plutôt le mode utilisateur existant."
            )
          }

          /**
           * -------------------------------------------------------------------
           * Téléphone
           * -------------------------------------------------------------------
           */
          const adminTelephone =
            this.normalizeValue(
              admin.telephone
            )

          if (
            adminTelephone
          ) {
            const telephoneExists =
              await User
                .query({
                  client:
                    trx,
                })
                .where(
                  'telephone',
                  adminTelephone
                )
                .first()

            if (
              telephoneExists
            ) {
              throw new Error(
                'Le téléphone de l’administrateur existe déjà.'
              )
            }
          }

          /**
           * -------------------------------------------------------------------
           * Informations obligatoires
           * -------------------------------------------------------------------
           */
          const adminNom =
            this.requiredString(
              admin.nom,
              'Le nom de l’administrateur est obligatoire.'
            )

          const adminPrenom =
            this.requiredString(
              admin.prenom,
              'Le prénom de l’administrateur est obligatoire.'
            )

          if (
            !admin.password ||
            String(
              admin.password
            ).length < 8
          ) {
            throw new Error(
              'Le mot de passe de l’administrateur doit contenir au moins 8 caractères.'
            )
          }

          /**
           * -------------------------------------------------------------------
           * Confirmation mot de passe
           * -------------------------------------------------------------------
           */
          if (
            admin.password_confirmation !==
              undefined &&
            admin.password_confirmation !==
              admin.password
          ) {
            throw new Error(
              'La confirmation du mot de passe ne correspond pas au mot de passe.'
            )
          }

          /**
           * -------------------------------------------------------------------
           * Token de vérification
           * -------------------------------------------------------------------
           */
          verificationToken =
            crypto
              .randomBytes(
                32
              )
              .toString(
                'hex'
              )

          /**
           * -------------------------------------------------------------------
           * Création User
           * -------------------------------------------------------------------
           *
           * Le mot de passe est assigné directement.
           * Le modèle User se charge de son hash.
           */
          administrator =
            new User()

          administrator.useTransaction(
            trx
          )

          administrator.merge({
            nom:
              adminNom,

            postnom:
              admin.postnom ??
              null,

            prenom:
              adminPrenom,

            pseudo:
              admin.pseudo ??
              null,

            email:
              adminEmail,

            telephone:
              adminTelephone,

            sexe:
              admin.sexe ??
              null,

            password:
              admin.password,

            statut:
              'EN ATTENTE',

            systemRole:
              SystemRole.USER,

            isVerified:
              false,

            token_verification:
              verificationToken,

            tokenVerificationExpiresAt:
              this.verificationExpiration(),
          })

          await administrator.save()

          /**
           * -------------------------------------------------------------------
           * Membership ADMIN_ECOLE
           * -------------------------------------------------------------------
           */
          const membership =
            new EcoleUser()

          membership.useTransaction(
            trx
          )

          membership.merge({
            userId:
              administrator.id,

            ecoleId:
              ecole.id,

            role:
              'ADMIN_ECOLE',

            statut:
              'ACTIF',
          })

          await membership.save()

          /**
           * -------------------------------------------------------------------
           * UserContext
           * -------------------------------------------------------------------
           *
           * Comme il s'agit d'un nouveau compte, la nouvelle école devient
           * son contexte actif.
           */
          const context =
            new UserContext()

          context.useTransaction(
            trx
          )

          context.merge({
            userId:
              administrator.id,

            ecoleId:
              ecole.id,

            role:
              'ADMIN_ECOLE',

            active:
              true,
          })

          await context.save()

          sendVerificationEmail =
            true
        }
      }

      /**
       * =========================================================================
       * COMMIT
       * =========================================================================
       */
      await trx.commit()

      /**
       * =========================================================================
       * EMAIL DE VÉRIFICATION
       * =========================================================================
       *
       * Uniquement pour un NOUVEL administrateur.
       */
      if (
        sendVerificationEmail &&
        administrator &&
        verificationToken
      ) {
        await this.verifyEmailMail.send(
          administrator,
          verificationToken
        )
      }

      /**
       * =========================================================================
       * RÉPONSE
       * =========================================================================
       */
      return {
        success:
          true,

        message:
          'École créée avec succès.',

        data: {
          school:
            await this.formatSchool(
              ecole
            ),

          administrator:
            administrator
              ? this.serializeAdministrator(
                  administrator
                )
              : null,
        },
      }
    } catch (error) {
      await trx.rollback()

      throw error
    }
  }

  /**
   * ==========================================================================
   * ÉCOLE PAR ID
   * ==========================================================================
   */
  async findById(
    id: number
  ) {
    const ecole =
      await Ecole.find(
        id
      )

    if (!ecole) {
      throw new Error(
        "Cette école n'existe pas."
      )
    }

    return ecole
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
    const trx =
      await db.transaction()

    try {
      const ecole =
        await Ecole
          .query({
            client:
              trx,
          })
          .where(
            'id',
            id
          )
          .first()

      if (!ecole) {
        throw new Error(
          "Cette école n'existe pas."
        )
      }

      const email =
        payload.email !==
        undefined
          ? this.normalizeEmail(
              payload.email
            )
          : ecole.email

      const telephone =
        payload.telephone !==
        undefined
          ? this.normalizeValue(
              payload.telephone
            )
          : ecole.telephone

      /**
       * ----------------------------------------------------------------------
       * Code unique
       * ----------------------------------------------------------------------
       */
      if (
        payload.code &&
        payload.code !==
          ecole.code
      ) {
        await this.validateUniqueCode(
          this.normalizeValue(
            payload.code
          )!,
          id,
          trx
        )
      }

      /**
       * ----------------------------------------------------------------------
       * Email unique
       * ----------------------------------------------------------------------
       */
      if (
        email &&
        email !==
          ecole.email
      ) {
        await this.validateUniqueEmail(
          email,
          id,
          trx
        )
      }

      /**
       * ----------------------------------------------------------------------
       * Téléphone unique
       * ----------------------------------------------------------------------
       */
      if (
        telephone &&
        telephone !==
          ecole.telephone
      ) {
        await this.validateUniqueTelephone(
          telephone,
          id,
          trx
        )
      }

      ecole.useTransaction(
        trx
      )

      ecole.merge({
        nom:
          payload.nom ??
          ecole.nom,

        code:
          payload.code ??
          ecole.code,

        description:
          payload.description !==
          undefined
            ? payload.description
            : ecole.description,

        email,

        telephone,

        adresse:
          payload.adresse !==
          undefined
            ? payload.adresse
            : ecole.adresse,

        ville:
          payload.ville !==
          undefined
            ? payload.ville
            : ecole.ville,

        pays:
          payload.pays !==
          undefined
            ? payload.pays
            : ecole.pays,

        province:
          payload.province !==
          undefined
            ? payload.province
            : ecole.province,

        commune:
          payload.commune !==
          undefined
            ? payload.commune
            : ecole.commune,

        quartier:
          payload.quartier !==
          undefined
            ? payload.quartier
            : ecole.quartier,

        siteWeb:
          payload.siteWeb !==
          undefined
            ? payload.siteWeb
            : ecole.siteWeb,

        type:
          payload.type !==
          undefined
            ? payload.type
            : ecole.type,

        anneeCreation:
          payload.anneeCreation !==
          undefined
            ? payload.anneeCreation
            : ecole.anneeCreation,

        logo:
          payload.logo !==
          undefined
            ? payload.logo
            : ecole.logo,

        statut:
          payload.statut ??
          ecole.statut,
      })

      await ecole.save()

      await trx.commit()

      return {
        success:
          true,

        message:
          'École modifiée avec succès.',

        data:
          await this.formatSchool(
            ecole
          ),
      }
    } catch (error) {
      await trx.rollback()

      throw error
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
    return this.setStatus(
      id,
      'SUSPENDU',
      'École suspendue avec succès.'
    )
  }

  /**
   * ==========================================================================
   * ACTIVER
   * ==========================================================================
   */
  async activate(
    id: number
  ) {
    return this.setStatus(
      id,
      'ACTIF',
      'École réactivée avec succès.'
    )
  }

  /**
   * ==========================================================================
   * ARCHIVER
   * ==========================================================================
   */
  async archive(
    id: number
  ) {
    return this.setStatus(
      id,
      'ARCHIVE',
      'École archivée avec succès.'
    )
  }

  /**
   * ==========================================================================
   * SUPPRESSION LOGIQUE
   * ==========================================================================
   *
   * Une école n'est jamais physiquement supprimée.
   * Elle passe à ARCHIVE.
   */
  async delete(
    id: number
  ) {
    const ecole =
      await this.findById(
        id
      )

    if (
      ecole.statut ===
      'ARCHIVE'
    ) {
      throw new Error(
        'Cette école est déjà archivée.'
      )
    }

    ecole.statut =
      'ARCHIVE'

    await ecole.save()

    return {
      success:
        true,

      message:
        'École supprimée avec succès.',

      data:
        await this.formatSchool(
          ecole
        ),
    }
  }

  /**
   * ==========================================================================
   * LISTE / PAGINATION
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
      Ecole.query()

    /**
     * ----------------------------------------------------------------------
     * Recherche globale
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
              'code',
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
              'ville',
              search
            )
            .orWhereILike(
              'province',
              search
            )
            .orWhereILike(
              'adresse',
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
     * Province
     * ----------------------------------------------------------------------
     */
    if (
      filters.province
    ) {
      query.whereILike(
        'province',
        String(
          filters.province
        )
      )
    }

    /**
     * ----------------------------------------------------------------------
     * Tri
     * ----------------------------------------------------------------------
     */
    const allowedSorts = [
      'nom',
      'code',
      'created_at',
      'updated_at',
      'statut',
    ]

    const sortBy =
      allowedSorts.includes(
        filters.sortBy
      )
        ? filters.sortBy
        : 'created_at'

    const order =
      filters.order ===
      'asc'
        ? 'asc'
        : 'desc'

    query.orderBy(
      sortBy,
      order
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
            (ecole) =>
              this.formatSchool(
                ecole
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
   * RECHERCHE RAPIDE
   * ==========================================================================
   *
   * Utilisée notamment par le sélecteur d'école du Super Administrateur.
   *
   * Le résultat reste volontairement léger.
   */
  async search(
    keyword = '',
    limit = 10
  ) {
    const value =
      String(
        keyword
      ).trim()

    if (!value) {
      return {
        success:
          true,

        data:
          [],
      }
    }

    const search =
      `%${value}%`

    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) ||
            10,
          1
        ),
        50
      )

    const rows =
      await Ecole
        .query()
        .where(
          (builder) => {
            builder
              .whereILike(
                'nom',
                search
              )
              .orWhereILike(
                'code',
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
                'ville',
                search
              )
              .orWhereILike(
                'province',
                search
              )
          }
        )
        .orderBy(
          'nom',
          'asc'
        )
        .limit(
          safeLimit
        )

    /**
     * Retour léger pour les sélecteurs.
     *
     * On évite ici les agrégations complètes de formatSchool().
     */
    return {
      success:
        true,

      data:
        rows.map(
          (ecole) => ({
            id:
              ecole.id,

            nom:
              ecole.nom,

            code:
              ecole.code,

            email:
              ecole.email,

            telephone:
              ecole.telephone,

            ville:
              ecole.ville,

            province:
              ecole.province,

            statut:
              ecole.statut,
          })
        ),
    }
  }

  /**
   * ==========================================================================
   * DÉTAILS D'UNE ÉCOLE
   * ==========================================================================
   */
  async details(
    id: number
  ) {
    const ecole =
      await this.findById(
        id
      )

    const [
      eleves,
      classes,
      utilisateurs,
      administrateurs,
    ] =
      await Promise.all([
        ecole
          .related(
            'eleves'
          )
          .query()
          .count(
            '* as total'
          ),

        ecole
          .related(
            'classes'
          )
          .query()
          .count(
            '* as total'
          ),

        ecole
          .related(
            'utilisateurs'
          )
          .query()
          .count(
            '* as total'
          ),

        EcoleUser
          .query()
          .where(
            'ecole_id',
            ecole.id
          )
          .where(
            'role',
            'ADMIN_ECOLE'
          )
          .where(
            'statut',
            'ACTIF'
          ),
      ])

    const administratorIds =
      administrateurs.map(
        (membership) =>
          membership.userId
      )

    const users =
      administratorIds.length
        ? await User
            .query()
            .whereIn(
              'id',
              administratorIds
            )
            .whereNull(
              'deleted_at'
            )
        : []

    return {
      success:
        true,

      data: {
        id:
          ecole.id,

        nom:
          ecole.nom,

        code:
          ecole.code,

        description:
          ecole.description,

        email:
          ecole.email,

        telephone:
          ecole.telephone,

        adresse:
          ecole.adresse,

        ville:
          ecole.ville,

        pays:
          ecole.pays,

        province:
          ecole.province,

        commune:
          ecole.commune,

        quartier:
          ecole.quartier,

        siteWeb:
          ecole.siteWeb,

        type:
          ecole.type,

        anneeCreation:
          ecole.anneeCreation,

        logo:
          ecole.logo,

        statut:
          ecole.statut,

        createdAt:
          ecole.createdAt,

        updatedAt:
          ecole.updatedAt,

        nombreEleves:
          Number(
            eleves[0].$extras
              .total
          ),

        nombreClasses:
          Number(
            classes[0].$extras
              .total
          ),

        nombreUtilisateurs:
          Number(
            utilisateurs[0].$extras
              .total
          ),

        /**
         * Administrateurs principaux.
         */
        administrateurs:
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

              isVerified:
                user.isVerified,

              createdAt:
                user.createdAt,
            })
          ),
      },
    }
  }

  /**
   * ==========================================================================
   * COMPTE PAR STATUT
   * ==========================================================================
   */
  async countByStatus() {
    const [
      total,
      actives,
      suspendues,
      archivees,
    ] =
      await Promise.all([
        Ecole
          .query()
          .count(
            '* as total'
          ),

        Ecole
          .query()
          .where(
            'statut',
            'ACTIF'
          )
          .count(
            '* as total'
          ),

        Ecole
          .query()
          .where(
            'statut',
            'SUSPENDU'
          )
          .count(
            '* as total'
          ),

        Ecole
          .query()
          .where(
            'statut',
            'ARCHIVE'
          )
          .count(
            '* as total'
          ),
      ])

    return {
      total:
        Number(
          total[0].$extras
            .total
        ),

      actives:
        Number(
          actives[0].$extras
            .total
        ),

      suspendues:
        Number(
          suspendues[0].$extras
            .total
        ),

      archivees:
        Number(
          archivees[0].$extras
            .total
        ),
    }
  }

  /**
   * ==========================================================================
   * PEUT ÊTRE SUPPRIMÉE
   * ==========================================================================
   */
  async canDelete(
    id: number
  ) {
    const ecole =
      await this.findById(
        id
      )

    const [
      utilisateurs,
      eleves,
      classes,
    ] =
      await Promise.all([
        ecole
          .related(
            'utilisateurs'
          )
          .query()
          .count(
            '* as total'
          ),

        ecole
          .related(
            'eleves'
          )
          .query()
          .count(
            '* as total'
          ),

        ecole
          .related(
            'classes'
          )
          .query()
          .count(
            '* as total'
          ),
      ])

    const counts = {
      utilisateurs:
        Number(
          utilisateurs[0].$extras
            .total
        ),

      eleves:
        Number(
          eleves[0].$extras
            .total
        ),

      classes:
        Number(
          classes[0].$extras
            .total
        ),
    }

    return {
      canDelete:
        counts.utilisateurs ===
          0 &&
        counts.eleves ===
          0 &&
        counts.classes ===
          0,

      informations:
        counts,
    }
  }

  /**
   * ==========================================================================
   * STATISTIQUES D'UNE ÉCOLE
   * ==========================================================================
   */
  async statistics(
    id: number
  ) {
    const ecole =
      await this.findById(
        id
      )

    const [
      eleves,
      classes,
      utilisateurs,
    ] =
      await Promise.all([
        ecole
          .related(
            'eleves'
          )
          .query()
          .count(
            '* as total'
          ),

        ecole
          .related(
            'classes'
          )
          .query()
          .count(
            '* as total'
          ),

        ecole
          .related(
            'utilisateurs'
          )
          .query()
          .count(
            '* as total'
          ),
      ])

    return {
      success:
        true,

      data: {
        ecole:
          await this.formatSchool(
            ecole
          ),

        eleves:
          Number(
            eleves[0].$extras
              .total
          ),

        classes:
          Number(
            classes[0].$extras
              .total
          ),

        utilisateurs:
          Number(
            utilisateurs[0].$extras
              .total
          ),
      },
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
      await Ecole.find(
        id
      )
    )
  }

  /**
   * ==========================================================================
   * CHANGEMENT DE STATUT
   * ==========================================================================
   */
  private async setStatus(
    id: number,
    statut: string,
    message: string
  ) {
    const ecole =
      await this.findById(
        id
      )

    if (
      ecole.statut ===
        'ARCHIVE' &&
      statut !==
        'ACTIF'
    ) {
      throw new Error(
        'Une école archivée ne peut pas être suspendue.'
      )
    }

    ecole.statut =
      statut

    await ecole.save()

    return {
      success:
        true,

      message,

      data:
        await this.formatSchool(
          ecole
        ),
    }
  }

  /**
   * ==========================================================================
   * CODE AUTOMATIQUE
   * ==========================================================================
   */
  private async generateCode() {
    for (
      let attempt = 0;
      attempt < 20;
      attempt++
    ) {
      const random =
        Math.floor(
          Math.random() *
            90 +
            10
        )

      const code =
        `SCH-${Date.now()
          .toString()
          .slice(
            -6
          )}${random}`

      const exists =
        await Ecole
          .query()
          .where(
            'code',
            code
          )
          .first()

      if (!exists) {
        return code
      }
    }

    throw new Error(
      'Impossible de générer un code école unique.'
    )
  }

  /**
   * ==========================================================================
   * VALIDATION UNICITÉ
   * ==========================================================================
   */
  private async assertUniqueSchool(
    payload: any,
    trx: any
  ) {
    await this.validateUniqueCode(
      payload.code,
      undefined,
      trx
    )

    if (
      payload.email
    ) {
      await this.validateUniqueEmail(
        payload.email,
        undefined,
        trx
      )
    }

    if (
      payload.telephone
    ) {
      await this.validateUniqueTelephone(
        payload.telephone,
        undefined,
        trx
      )
    }
  }

  /**
   * ==========================================================================
   * CODE ÉCOLE UNIQUE
   * ==========================================================================
   */
  private async validateUniqueCode(
    code: string,
    exceptId?: number,
    trx?: any
  ) {
    const query =
      Ecole.query(
        trx
          ? {
              client:
                trx,
            }
          : undefined
      )
        .where(
          'code',
          code
        )

    if (
      exceptId
    ) {
      query.whereNot(
        'id',
        exceptId
      )
    }

    if (
      await query.first()
    ) {
      throw new Error(
        'Ce code école existe déjà.'
      )
    }
  }

  /**
   * ==========================================================================
   * EMAIL ÉCOLE UNIQUE
   * ==========================================================================
   */
  private async validateUniqueEmail(
    email: string,
    exceptId?: number,
    trx?: any
  ) {
    const query =
      Ecole.query(
        trx
          ? {
              client:
                trx,
            }
          : undefined
      )
        .where(
          'email',
          email
        )

    if (
      exceptId
    ) {
      query.whereNot(
        'id',
        exceptId
      )
    }

    if (
      await query.first()
    ) {
      throw new Error(
        'Cette adresse email existe déjà pour une école.'
      )
    }
  }

  /**
   * ==========================================================================
   * TÉLÉPHONE ÉCOLE UNIQUE
   * ==========================================================================
   *
   * Ordre standardisé :
   *
   * telephone → exceptId → trx
   *
   * Cela permet de réutiliser la même méthode :
   *
   * - création : telephone, undefined, trx
   * - modification : telephone, id, trx
   */
  private async validateUniqueTelephone(
    telephone: string,
    exceptId?: number,
    trx?: any
  ) {
    const query =
      Ecole.query(
        trx
          ? {
              client:
                trx,
            }
          : undefined
      )
        .where(
          'telephone',
          telephone
        )

    if (
      exceptId
    ) {
      query.whereNot(
        'id',
        exceptId
      )
    }

    if (
      await query.first()
    ) {
      throw new Error(
        'Ce numéro de téléphone existe déjà pour une école.'
      )
    }
  }

  /**
   * ==========================================================================
   * FORMAT ÉCOLE
   * ==========================================================================
   */
  private async formatSchool(
    ecole: Ecole,
    details = false
  ) {
    const [
      eleves,
      administrateurs,
      utilisateurs,
    ] =
      await Promise.all([
        ecole
          .related(
            'eleves'
          )
          .query()
          .count(
            '* as total'
          ),

        ecole
          .related(
            'utilisateurs'
          )
          .query()
          .wherePivot(
            'role',
            'ADMIN_ECOLE'
          )
          .wherePivot(
            'statut',
            'ACTIF'
          )
          .count(
            '* as total'
          ),

        ecole
          .related(
            'utilisateurs'
          )
          .query()
          .wherePivot(
            'statut',
            'ACTIF'
          )
          .count(
            '* as total'
          ),
      ])

    const item: any = {
      id:
        ecole.id,

      nom:
        ecole.nom,

      code:
        ecole.code,

      description:
        ecole.description,

      email:
        ecole.email,

      telephone:
        ecole.telephone,

      adresse:
        ecole.adresse,

      ville:
        ecole.ville,

      pays:
        ecole.pays,

      province:
        ecole.province,

      commune:
        ecole.commune,

      quartier:
        ecole.quartier,

      siteWeb:
        ecole.siteWeb,

      type:
        ecole.type,

      anneeCreation:
        ecole.anneeCreation,

      logo:
        ecole.logo,

      statut:
        ecole.statut,

      nombreEleves:
        Number(
          eleves[0].$extras
            .total
        ),

      nombreAdministrateurs:
        Number(
          administrateurs[0].$extras
            .total
        ),

      nombreUtilisateurs:
        Number(
          utilisateurs[0].$extras
            .total
        ),

      createdAt:
        ecole.createdAt,

      updatedAt:
        ecole.updatedAt,
    }

    if (
      details
    ) {
      item.utilisateurs =
        ecole.utilisateurs

      item.eleves =
        ecole.eleves

      item.classes =
        ecole.classes

      item.niveaux =
        ecole.niveaux

      item.matieres =
        ecole.matieres
    }

    return item
  }

  /**
   * ==========================================================================
   * FORMAT ADMINISTRATEUR
   * ==========================================================================
   */
  private serializeAdministrator(
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

      statut:
        user.statut,

      systemRole:
        user.systemRole,

      isVerified:
        user.isVerified,

      createdAt:
        user.createdAt,
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
      value ===
        undefined ||
      value ===
        null ||
      String(
        value
      ).trim() ===
        ''
    ) {
      return null
    }

    return String(
      value
    )
      .trim()
      .toLowerCase()
  }

  private requiredEmail(
    value: unknown,
    message: string
  ) {
    const email =
      this.normalizeEmail(
        value
      )

    if (!email) {
      throw new Error(
        message
      )
    }

    return email
  }

  private normalizeValue(
    value: unknown
  ) {
    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      return null
    }

    const normalized =
      String(
        value
      ).trim()

    return (
      normalized ||
      null
    )
  }

  private requiredString(
    value: unknown,
    message: string
  ) {
    const normalized =
      this.normalizeValue(
        value
      )

    if (!normalized) {
      throw new Error(
        message
      )
    }

    return normalized
  }

  private verificationExpiration() {
    return DateTime.now().plus({
      days: 1,
    })
  }
}
