import db from '@adonisjs/lucid/services/db'

import Matiere from '#models/matiere'
import Devoir from '#models/devoir'
import Exercice from '#models/exercice'
import UserContext from '#models/user_context'

export default class MatiereService {
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
   * NORMALISATION DU NOM
   * --------------------------------------------------------------------------
   */
  private normalizeName(value: unknown) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * --------------------------------------------------------------------------
   * SÉRIALISATION
   * --------------------------------------------------------------------------
   */
  private serializeSubject(
    matiere: Matiere
  ) {
    return {
      id: matiere.id,

      ecoleId:
        matiere.ecoleId,

      nom:
        matiere.nom,

      description:
        matiere.description,

      statut:
        matiere.statut,

      createdAt:
        matiere.createdAt,

      updatedAt:
        matiere.updatedAt,
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
      this.normalizeName(
        options.search
      )

    const statut =
      String(
        options.statut || ''
      )
        .trim()
        .toUpperCase()

    const query =
      Matiere
        .query()
        .where(
          'ecole_id',
          context.ecoleId
        )
        .orderBy(
          'nom',
          'asc'
        )

    /**
     * Recherche par nom.
     */
    if (search) {
      query.whereILike(
        'nom',
        `%${search}%`
      )
    }

    /**
     * Filtre de statut.
     */
    if (
      [
        'ACTIVE',
        'INACTIVE',
      ].includes(
        statut
      )
    ) {
      query.where(
        'statut',
        statut
      )
    }

    const result =
      await query.paginate(
        page,
        limit
      )

    return {
      success: true,

      data: {
        meta:
          result.getMeta(),

        data:
          result
            .all()
            .map(
              (matiere) =>
                this.serializeSubject(
                  matiere
                )
            ),
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
      Matiere
        .query()
        .where(
          'ecole_id',
          context.ecoleId
        )

    const [
      total,
      actives,
      inactives,
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
            'ACTIVE'
          )
          .count(
            '* as total'
          ),

        base
          .clone()
          .where(
            'statut',
            'INACTIVE'
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

        actives:
          Number(
            actives[0].$extras.total ||
              0
          ),

        inactives:
          Number(
            inactives[0].$extras.total ||
              0
          ),
      },
    }
  }

  /**
   * --------------------------------------------------------------------------
   * DÉTAIL
   * --------------------------------------------------------------------------
   */
  async find(
    userId: number,
    matiereId: number
  ) {
    const context =
      await this.getContext(
        userId
      )

    const matiere =
      await Matiere
        .query()
        .where(
          'id',
          matiereId
        )
        .where(
          'ecole_id',
          context.ecoleId
        )
        .first()

    if (!matiere) {
      throw new Error(
        'Cette matière n’existe pas dans votre établissement.'
      )
    }

    /**
     * Récupération du nombre de devoirs/exercices liés.
     *
     * La matière peut donc afficher ses dépendances dans le détail.
     */
    const [
      devoirsCount,
      exercicesCount,
    ] =
      await Promise.all([
        Devoir
          .query()
          .where(
            'matiere_id',
            matiere.id
          )
          .count(
            '* as total'
          ),

        Exercice
          .query()
          .where(
            'matiere_id',
            matiere.id
          )
          .count(
            '* as total'
          ),
      ])

    return {
      success: true,

      data: {
        ...this.serializeSubject(
          matiere
        ),

        devoirsCount:
          Number(
            devoirsCount[0].$extras.total ||
              0
          ),

        exercicesCount:
          Number(
            exercicesCount[0].$extras.total ||
              0
          ),
      },
    }
  }

  /**
   * --------------------------------------------------------------------------
   * CRÉATION
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

    const nom =
      this.normalizeName(
        payload?.nom
      )

    const description =
      payload?.description !==
      undefined
        ? String(
            payload.description || ''
          ).trim() || null
        : null

    const statut =
      String(
        payload?.statut ||
          'ACTIVE'
      )
        .trim()
        .toUpperCase()

    if (!nom) {
      throw new Error(
        'Le nom de la matière est obligatoire.'
      )
    }

    if (nom.length > 100) {
      throw new Error(
        'Le nom de la matière ne peut pas dépasser 100 caractères.'
      )
    }

    if (
      ![
        'ACTIVE',
        'INACTIVE',
      ].includes(
        statut
      )
    ) {
      throw new Error(
        'Statut de matière invalide.'
      )
    }

    const existing =
      await Matiere
        .query()
        .where(
          'ecole_id',
          context.ecoleId
        )
        .whereILike(
          'nom',
          nom
        )
        .first()

    if (existing) {
      throw new Error(
        'Une matière portant ce nom existe déjà dans votre établissement.'
      )
    }

    const trx =
      await db.transaction()

    try {
      const matiere =
        new Matiere()

      matiere.useTransaction(
        trx
      )

      matiere.merge({
        ecoleId:
          context.ecoleId,

        nom,

        description,

        statut,
      })

      await matiere.save()

      await trx.commit()

      return {
        success: true,

        message:
          'Matière créée avec succès.',

        data:
          this.serializeSubject(
            matiere
          ),
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
    matiereId: number,
    payload: any
  ) {
    const context =
      await this.getContext(
        userId
      )

    const matiere =
      await Matiere
        .query()
        .where(
          'id',
          matiereId
        )
        .where(
          'ecole_id',
          context.ecoleId
        )
        .first()

    if (!matiere) {
      throw new Error(
        'Cette matière n’existe pas dans votre établissement.'
      )
    }

    const nom =
      payload?.nom !==
      undefined
        ? this.normalizeName(
            payload.nom
          )
        : matiere.nom

    const description =
      payload?.description !==
      undefined
        ? String(
            payload.description || ''
          ).trim() || null
        : matiere.description

    const statut =
      payload?.statut !==
      undefined
        ? String(
            payload.statut || ''
          )
            .trim()
            .toUpperCase()
        : matiere.statut

    if (!nom) {
      throw new Error(
        'Le nom de la matière est obligatoire.'
      )
    }

    if (nom.length > 100) {
      throw new Error(
        'Le nom de la matière ne peut pas dépasser 100 caractères.'
      )
    }

    if (
      ![
        'ACTIVE',
        'INACTIVE',
      ].includes(
        statut
      )
    ) {
      throw new Error(
        'Statut de matière invalide.'
      )
    }

    /**
     * Vérification de l'unicité du nom dans la même école.
     */
    const duplicate =
      await Matiere
        .query()
        .where(
          'ecole_id',
          context.ecoleId
        )
        .whereILike(
          'nom',
          nom
        )
        .where(
          'id',
          '!=',
          matiere.id
        )
        .first()

    if (duplicate) {
      throw new Error(
        'Une autre matière portant ce nom existe déjà dans votre établissement.'
      )
    }

    matiere.nom =
      nom

    matiere.description =
      description

    matiere.statut =
      statut

    await matiere.save()

    return {
      success: true,

      message:
        'Matière mise à jour avec succès.',

      data:
        this.serializeSubject(
          matiere
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
    matiereId: number,
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
        'ACTIVE',
        'INACTIVE',
      ].includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        'Statut de matière invalide.'
      )
    }

    const matiere =
      await Matiere
        .query()
        .where(
          'id',
          matiereId
        )
        .where(
          'ecole_id',
          context.ecoleId
        )
        .first()

    if (!matiere) {
      throw new Error(
        'Cette matière n’existe pas dans votre établissement.'
      )
    }

    matiere.statut =
      normalizedStatus

    await matiere.save()

    return {
      success: true,

      message:
        normalizedStatus ===
        'ACTIVE'
          ? 'La matière a été activée.'
          : 'La matière a été désactivée.',

      data:
        this.serializeSubject(
          matiere
        ),
    }
  }

  /**
   * --------------------------------------------------------------------------
   * SUPPRESSION
   * --------------------------------------------------------------------------
   */
  async remove(
    userId: number,
    matiereId: number
  ) {
    const context =
      await this.getContext(
        userId
      )

    const matiere =
      await Matiere
        .query()
        .where(
          'id',
          matiereId
        )
        .where(
          'ecole_id',
          context.ecoleId
        )
        .first()

    if (!matiere) {
      throw new Error(
        'Cette matière n’existe pas dans votre établissement.'
      )
    }

    /**
     * Vérifier les dépendances.
     */
    const [
      devoirsCount,
      exercicesCount,
    ] =
      await Promise.all([
        Devoir
          .query()
          .where(
            'matiere_id',
            matiere.id
          )
          .count(
            '* as total'
          ),

        Exercice
          .query()
          .where(
            'matiere_id',
            matiere.id
          )
          .count(
            '* as total'
          ),
      ])

    const devoirs =
      Number(
        devoirsCount[0].$extras.total ||
          0
      )

    const exercices =
      Number(
        exercicesCount[0].$extras.total ||
          0
      )

    if (
      devoirs > 0 ||
      exercices > 0
    ) {
      const dependencies = []

      if (devoirs > 0) {
        dependencies.push(
          `${devoirs} devoir${
            devoirs > 1
              ? 's'
              : ''
          }`
        )
      }

      if (exercices > 0) {
        dependencies.push(
          `${exercices} exercice${
            exercices > 1
              ? 's'
              : ''
          }`
        )
      }

      throw new Error(
        `Cette matière ne peut pas être supprimée car elle est utilisée par ${dependencies.join(' et ')}.`
      )
    }

    await matiere.delete()

    return {
      success: true,

      message:
        'La matière a été supprimée avec succès.',
    }
  }
}