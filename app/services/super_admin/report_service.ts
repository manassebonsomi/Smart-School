import db from '@adonisjs/lucid/services/db'

import DashboardService from '#services/super_admin/dashboard_service'
import Ecole from '#models/ecole'


type ReportType =
  | 'schools'
  | 'users'
  | 'students'
  | 'platform'


interface ReportDefinition {
  id: string
  type: ReportType
  name: string
  description: string
  format: 'csv'
  icon: string
  color: string
}


export default class ReportService {
  private dashboard =
    new DashboardService()


  /**
   * ==========================================================================
   * DÉFINITIONS DES RAPPORTS
   * ==========================================================================
   */
  private readonly definitions: ReportDefinition[] = [

    {
      id: 'schools-overview',
      type: 'schools',
      name: 'Rapport des écoles',
      description:
        'Liste et état des établissements enregistrés dans Smart School.',
      format: 'csv',
      icon: 'fa-school',
      color: 'sky',
    },

    {
      id: 'users-overview',
      type: 'users',
      name: 'Rapport des utilisateurs',
      description:
        'Utilisateurs enregistrés avec leur statut et leur rôle système.',
      format: 'csv',
      icon: 'fa-users',
      color: 'indigo',
    },

    {
      id: 'students-overview',
      type: 'students',
      name: 'Rapport des élèves',
      description:
        'Liste des élèves enregistrés avec leur matricule et leur statut.',
      format: 'csv',
      icon: 'fa-user-graduate',
      color: 'emerald',
    },

    {
      id: 'platform-overview',
      type: 'platform',
      name: 'Rapport global de la plateforme',
      description:
        'Synthèse des principaux indicateurs de Smart School.',
      format: 'csv',
      icon: 'fa-chart-column',
      color: 'violet',
    },

  ]


  /**
   * ==========================================================================
   * LISTE DES RAPPORTS
   * ==========================================================================
   */
  async list(
    filters: {
      type?: string | null
    } = {}
  ) {

    const requestedType =
      this.normalizeType(
        filters.type
      )


    let reports =
      [...this.definitions]


    if (requestedType) {

      reports =
        reports.filter(
          report =>
            report.type === requestedType
        )

    }


    return {

      success: true,

      data: reports,

    }

  }


  /**
   * ==========================================================================
   * GÉNÉRATION
   * ==========================================================================
   *
   * Le système actuel génère directement un rapport prêt
   * à être téléchargé.
   */
  async generate(
    type: string
  ) {

    const normalizedType =
      this.normalizeType(type)


    if (!normalizedType) {

      throw new Error(
        'Type de rapport invalide.'
      )

    }


    const definition =
      this.getDefinition(
        normalizedType
      )


    /*
     * On vérifie réellement que le rapport
     * peut être généré.
     */
    await this.download(
      normalizedType
    )


    return {

      success: true,

      message:
        'Rapport généré avec succès.',

      data: {

        id:
          `${normalizedType}-${Date.now()}`,

        type:
          definition.type,

        name:
          definition.name,

        format:
          definition.format,

        status:
          'READY',

        generatedAt:
          new Date().toISOString(),

      },

    }

  }


  /**
   * ==========================================================================
   * TÉLÉCHARGEMENT / CONSTRUCTION DU CSV
   * ==========================================================================
   */
  async download(
    type: string
  ): Promise<string> {

    const normalizedType =
      this.normalizeType(type)


    if (!normalizedType) {

      throw new Error(
        'Type de rapport invalide.'
      )

    }


    let rows: string[][] = []


    /*
     * ------------------------------------------------------------------------
     * ÉCOLES
     * ------------------------------------------------------------------------
     */

    if (
      normalizedType ===
      'schools'
    ) {

      const schools =
        await Ecole
          .query()
          .orderBy(
            'nom',
            'asc'
          )


      rows = [

        [
          'ID',
          'Nom',
          'Code',
          'Email',
          'Téléphone',
          'Adresse',
          'Province',
          'Ville',
          'Pays',
          'Type',
          'Statut',
          'Année de création',
          'Créée le',
        ],

      ]


      for (
        const school
        of schools
      ) {

        rows.push([

          String(school.id),

          school.nom ?? '',

          school.code ?? '',

          school.email ?? '',

          school.telephone ?? '',

          school.adresse ?? '',

          school.province ?? '',

          school.ville ?? '',

          school.pays ?? '',

          school.type ?? '',

          school.statut ?? '',

          school.anneeCreation != null
            ? String(
                school.anneeCreation
              )
            : '',

          school.createdAt
            ?.toISO() ?? '',

        ])

      }

    }


    /*
     * ------------------------------------------------------------------------
     * UTILISATEURS
     * ------------------------------------------------------------------------
     */

    else if (
      normalizedType ===
      'users'
    ) {

      const users =
        await db
          .from('users')
          .whereNull('deleted_at')
          .orderBy(
            'created_at',
            'asc'
          )
          .select([

            'id',

            'prenom',

            'nom',

            'postnom',

            'pseudo',

            'email',

            'telephone',

            'statut',

            'system_role',

            'is_verified',

            'created_at',

            'last_login_at',

          ])


      rows = [

        [
          'ID',
          'Prénom',
          'Nom',
          'Postnom',
          'Pseudo',
          'Email',
          'Téléphone',
          'Statut',
          'Rôle système',
          'Email vérifié',
          'Créé le',
          'Dernière connexion',
        ],

      ]


      for (
        const user
        of users
      ) {

        rows.push([

          String(
            user.id
          ),

          user.prenom ?? '',

          user.nom ?? '',

          user.postnom ?? '',

          user.pseudo ?? '',

          user.email ?? '',

          user.telephone ?? '',

          user.statut ?? '',

          user.system_role ?? '',

          user.is_verified
            ? 'Oui'
            : 'Non',

          user.created_at
            ? new Date(
                user.created_at
              ).toISOString()
            : '',

          user.last_login_at
            ? new Date(
                user.last_login_at
              ).toISOString()
            : '',

        ])

      }

    }


    /*
     * ------------------------------------------------------------------------
     * ÉLÈVES
     * ------------------------------------------------------------------------
     */

    else if (
      normalizedType ===
      'students'
    ) {

      const students =
        await db
          .from('eleves')
          .orderBy(
            'created_at',
            'asc'
          )
          .select([

            'id',

            'matricule',

            'nom',

            'prenom',

            'statut',

            'created_at',

          ])


      rows = [

        [
          'ID',
          'Matricule',
          'Nom',
          'Prénom',
          'Statut',
          'Créé le',
        ],

      ]


      for (
        const student
        of students
      ) {

        rows.push([

          String(
            student.id
          ),

          student.matricule ?? '',

          student.nom ?? '',

          student.prenom ?? '',

          student.statut ?? '',

          student.created_at
            ? new Date(
                student.created_at
              ).toISOString()
            : '',

        ])

      }

    }


    /*
     * ------------------------------------------------------------------------
     * PLATEFORME
     * ------------------------------------------------------------------------
     */

    else {

      const statistics =
        await this.dashboard
          .getStatistics()


      rows = [

        [
          'Indicateur',
          'Valeur',
        ],

        [
          'Écoles',
          String(
            statistics.totalSchools
          ),
        ],

        [
          'Écoles actives',
          String(
            statistics.activeSchools
          ),
        ],

        [
          'Écoles suspendues',
          String(
            statistics.suspendedSchools
          ),
        ],

        [
          'Écoles archivées',
          String(
            Math.max(
              statistics.totalSchools -
              statistics.activeSchools -
              statistics.suspendedSchools,
              0
            )
          ),
        ],

        [
          'Utilisateurs',
          String(
            statistics.totalUsers
          ),
        ],

        [
          'Élèves',
          String(
            statistics.totalStudents
          ),
        ],

        [
          'Administrateurs actifs',
          String(
            statistics.activeAdministrators
          ),
        ],

      ]

    }


    return this.buildCsv(
      rows
    )

  }


  /**
   * ==========================================================================
   * HELPERS
   * ==========================================================================
   */

  private normalizeType(
    type?: string | null
  ): ReportType | null {

    const value =
      String(
        type ?? ''
      )
        .trim()
        .toLowerCase()


    const allowed: ReportType[] = [

      'schools',
      'users',
      'students',
      'platform',

    ]


    return allowed.includes(
      value as ReportType
    )
      ? value as ReportType
      : null

  }


  private getDefinition(
    type: ReportType
  ) {

    const definition =
      this.definitions.find(
        report =>
          report.type === type
      )


    if (!definition) {

      throw new Error(
        'Définition du rapport introuvable.'
      )

    }


    return definition

  }


  private buildCsv(
    rows: string[][]
  ) {

    return rows

      .map(
        row =>
          row
            .map(
              value =>
                `"${String(
                  value ?? ''
                ).replaceAll(
                  '"',
                  '""'
                )}"`
            )
            .join(',')
      )

      .join('\n')

  }

}