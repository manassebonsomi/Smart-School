import db from '@adonisjs/lucid/services/db'
import Ecole from '#models/ecole'

export default class EcoleService {

  /**
   * ============================================================================
   * Créer une école
   * ============================================================================
   */
  async create(payload: any) {

    const trx = await db.transaction()

    try {

      await this.validateUniqueCode(payload.code)

      if (payload.email) {
        await this.validateUniqueEmail(payload.email)
      }

      if (payload.telephone) {
        await this.validateUniqueTelephone(payload.telephone)
      }

      const ecole = await Ecole.create({
        nom: payload.nom,
        code: payload.code,
        adresse: payload.adresse,
        telephone: payload.telephone,
        email: payload.email,
        statut: 'ACTIF',

      }, { client: trx })

      await trx.commit()

      return {
        success: true,
        message: 'École créée avec succès.',
        data: ecole
      }

    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * ============================================================================
   * Rechercher une école par ID
   * ============================================================================
   */
  async findById(id: number) {

    const ecole = await Ecole.find(id)

    if (!ecole) {
      throw new Error("Cette école n'existe pas.")
    }
    return ecole

  }

    /**
   * ============================================================================
   * Modifier une école
   * ============================================================================
   */
  async update(id: number, payload: any) {

    const trx = await db.transaction()

    try {

      const ecole = await Ecole.query({ client: trx }).where('id', id).first()

      if (!ecole) {
        throw new Error("Cette école n'existe pas.")
      }


      if (payload.code && payload.code !== ecole.code) {
        await this.validateUniqueCode(payload.code)
      }


      if (payload.email && payload.email !== ecole.email) {
        await this.validateUniqueEmail(payload.email)
      }


      if (payload.telephone && payload.telephone !== ecole.telephone) {
        await this.validateUniqueTelephone(payload.telephone)
      }


      ecole.merge({
        nom: payload.nom ?? ecole.nom,
        code: payload.code ?? ecole.code,
        adresse: payload.adresse ?? ecole.adresse,
        telephone: payload.telephone ?? ecole.telephone,
        email: payload.email ?? ecole.email,
      })

      await ecole.save()
      await trx.commit()


      return {
        success: true,
        message: "École modifiée avec succès.",
        data: ecole

      }


    } catch (error) {
      await trx.rollback()
      throw error
    }

  }


  /**
   * ============================================================================
   * Suspendre une école
   * ============================================================================
   */
  async suspend(id: number) {

    const ecole = await this.findById(id)

    if (ecole.statut === 'SUSPENDU') {
      throw new Error("Cette école est déjà suspendue.")
    }

    ecole.statut = 'SUSPENDU'

    await ecole.save()


    return {
      success: true,
      message: "École suspendue avec succès.",
      data: ecole

    }

  }


  /**
   * ============================================================================
   * Réactiver une école
   * ============================================================================
   */
  async activate(id: number) {

    const ecole = await this.findById(id)


    if (ecole.statut === 'ACTIF') {
      throw new Error("Cette école est déjà active.")
    }


    ecole.statut = 'ACTIF'

    await ecole.save()


    return {
      success: true,
      message: "École réactivée avec succès.",
      data: ecole
    }

  }


  /**
   * ============================================================================
   * Archiver une école
   * ============================================================================
   */
  async archive(id: number) {

    const ecole = await this.findById(id)
    ecole.statut = 'ARCHIVE'

    await ecole.save()

    return {
      success: true,
      message: "École archivée avec succès.",
      data: ecole
    }

  }


  /**
   * ============================================================================
   * Suppression logique
   * ============================================================================
   *
   * On ne supprime pas réellement l'école.
   * On l'archive afin de conserver l'historique.
   *
   */
  async delete(id: number) {

    const ecole = await this.findById(id)
    ecole.statut = 'ARCHIVE'
    await ecole.save()


    return {
      success: true,
      message: "École supprimée avec succès."
    }

  }

    /**
   * ============================================================================
   * Liste des écoles avec pagination
   * ============================================================================
   */
  async findAll(page: number = 1, limit: number = 10, filters: any = {}) {

    const query = Ecole.query().orderBy('created_at', 'desc')

    /**
     * Recherche générale
     */
    if (filters.search) {

      query.where((builder) => {
        builder
          .whereILike('nom', `%${filters.search}%`)
          .orWhereILike('code', `%${filters.search}%`)
          .orWhereILike('email', `%${filters.search}%`)
      })

    }

    /**
     * Filtrer par statut
     */
    if (filters.statut) {
      query.where('statut', filters.statut)
    }


    /**
     * Pagination
     */
    const result = await query.paginate(page, limit)

    return {
      success: true,
      data: result
    }

  }



  /**
   * ============================================================================
   * Recherche avancée d'une école
   * ============================================================================
   */
  async search(keyword: string) {

    const ecoles = await Ecole.query().where((builder) => {
        builder
          .whereILike('nom', `%${keyword}%`)
          .orWhereILike('code', `%${keyword}%`)
          .orWhereILike('email', `%${keyword}%`)
      })
      .orderBy('nom', 'asc')

    return {
      success: true,
      data: ecoles
    }

  }

  /**
   * ============================================================================
   * Obtenir les détails complets d'une école
   * ============================================================================
   */
  async details(id: number) {

    const ecole = await Ecole.query().where('id', id).preload('utilisateurs', (query) => {
        query
          .pivotColumns([
            'role',
            'statut'
          ])
      })
      .preload('eleves')
      .preload('classes')
      .preload('niveaux')
      .preload('matieres')
      .first()


    if (!ecole) {
      throw new Error("Cette école n'existe pas.")
    }

    return {
      success: true,
      data: ecole
    }

  }



  /**
   * ============================================================================
   * Compter les écoles selon leur statut
   * ============================================================================
   */
  async countByStatus() {
    const total = await Ecole.query().count('* as total')
    const actives = await Ecole.query().where('statut', 'ACTIF').count('* as total')
    const suspendues = await Ecole.query().where('statut', 'SUSPENDU').count('* as total')
    const archivees = await Ecole.query().where('statut', 'ARCHIVE').count('* as total')


    return {
      total: Number(total[0].$extras.total),
      actives: Number(actives[0].$extras.total),
      suspendues: Number(suspendues[0].$extras.total),
      archivees: Number(archivees[0].$extras.total)
    }
  }

    /**
   * ============================================================================
   * Vérifier si une école peut être supprimée
   * ============================================================================
   */
  async canDelete(id: number) {
    const ecole = await this.findById(id)
    const utilisateurs = await ecole.related('utilisateurs').query().count('* as total')
    const eleves = await ecole.related('eleves').query().count('* as total')
    const classes = await ecole.related('classes').query().count('* as total')

    return {

      canDelete:
        Number(utilisateurs[0].$extras.total) === 0 &&
        Number(eleves[0].$extras.total) === 0 &&
        Number(classes[0].$extras.total) === 0,

      informations: {
        utilisateurs:Number(utilisateurs[0].$extras.total),
        eleves:Number(eleves[0].$extras.total),
        classes:Number(classes[0].$extras.total)
      }
    }
  }

  /**
   * ============================================================================
   * Récupérer les administrateurs d'une école
   * ============================================================================
   */
  async getAdministrateurs(id: number) {

    const ecole = await this.findById(id)
    const administrateurs = await ecole.related('utilisateurs').query().wherePivot('role', 'ADMIN_ECOLE').wherePivot('statut', 'ACTIF')
    return {
      success: true,
      data: administrateurs
    }

  }



  /**
   * ============================================================================
   * Statistiques complètes d'une école
   * ============================================================================
   */
  async statistics(id: number) {

    const ecole = await this.findById(id)
    const utilisateurs = await ecole.related('utilisateurs').query().count('* as total')
    const enseignants = await ecole.related('utilisateurs').query().wherePivot('role', 'ENSEIGNANT').count('* as total')
    const parents = await ecole.related('utilisateurs').query().wherePivot('role', 'PARENT').count('* as total')
    const eleves = await ecole.related('eleves').query().count('* as total')
    const classes = await ecole.related('classes').query().count('* as total')
    const matieres = await ecole.related('matieres').query().count('* as total')

    return {

      ecole: {
        id: ecole.id,
        nom: ecole.nom,
        statut: ecole.statut
      },


      statistiques: {

        utilisateurs:Number(utilisateurs[0].$extras.total),
        enseignants:Number(enseignants[0].$extras.total),
        parents:Number(parents[0].$extras.total),
        eleves:Number(eleves[0].$extras.total),
        classes:Number(classes[0].$extras.total),
        matieres:Number(matieres[0].$extras.total)

      }

    }

  }



  /**
   * ============================================================================
   * Vérifier existence école
   * ============================================================================
   */
  async exists(id: number) {

    const ecole = await Ecole.query().where('id', id).first()
    return !!ecole

  }

  /**
   * ============================================================================
   * Vérification avant modification
   * ============================================================================
   */
  private validateStatus(status: string) {

    const statuses = [
      'ACTIF',
      'SUSPENDU',
      'ARCHIVE'
    ]


    if (!statuses.includes(status)) {
      throw new Error(
        "Statut d'école invalide."
      )

    }

  }

  /**
   * ============================================================================
   * Validation Code unique
   * ============================================================================
   */
  private async validateUniqueCode(code: string) {
    const exists = await Ecole.findBy('code', code)
    if (exists) {
      throw new Error("Ce code d'école existe déjà.")
    }

  }

  /**
   * ============================================================================
   * Validation Email unique
   * ============================================================================
   */
  private async validateUniqueEmail(email: string) {

    const exists = await Ecole.findBy('email', email)

    if (exists) {
      throw new Error("Cette adresse email est déjà utilisée.")
    }
  }


  /**
   * ============================================================================
   * Validation Téléphone unique
   * ============================================================================
   */
  private async validateUniqueTelephone(telephone: string) {

    const exists = await Ecole.findBy('telephone', telephone)

    if (exists) {
      throw new Error("Ce numéro de téléphone est déjà utilisé.")
    }

  }

}