import db from '@adonisjs/lucid/services/db'

import Ecole from '#models/ecole'
import User from '#models/user'
import Eleve from '#models/eleve'


export default class DashboardService {

  /**
   * ==========================================================================
   * DASHBOARD COMPLET
   * ==========================================================================
   */
  async getFullDashboard() {

    const currentYear = new Date().getFullYear()

    const [
      statistics,
      schoolsByStatus,
      usersByRole,
      recentSchools,
      recentAdministrators,
      topSchools,
      schoolsStatistics,
      activities,
      monthlySchools,
      monthlyUsers,
      systemHealth,
    ] = await Promise.all([

      this.getStatistics(),

      this.getSchoolsByStatus(),

      this.getUsersByRole(),

      this.getRecentSchools(5),

      this.getRecentAdministrators(5),

      this.getTopSchools(5),

      this.getSchoolsWithStatistics(),

      this.getRecentActivities(10),

      this.getMonthlySchools(currentYear),

      this.getMonthlyUsers(currentYear),

      this.getSystemHealth(),

    ])


    return {

      success: true,

      data: {

        statistics,

        schoolsByStatus,

        usersByRole,

        recentSchools,

        recentAdministrators,

        topSchools,

        schoolsStatistics,

        activities,

        monthlySchools,

        monthlyUsers,

        systemHealth,

      },

    }

  }


  /**
   * ==========================================================================
   * STATISTIQUES GLOBALES
   * ==========================================================================
   */
  async getStatistics() {

    const [
      schools,
      users,
      students,
      administrators,
      teachers,
      parents,
      activeSchools,
      suspendedSchools,
      archivedSchools,
      activeUsers,
    ] = await Promise.all([

      Ecole
        .query()
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .count('* as total'),

      Eleve
        .query()
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .whereHas('ecoles', (query) => {
          query
            .wherePivot('role', 'ADMIN_ECOLE')
            .wherePivot('statut', 'ACTIF')
        })
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .whereHas('ecoles', (query) => {
          query
            .wherePivot('role', 'ENSEIGNANT')
            .wherePivot('statut', 'ACTIF')
        })
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .whereHas('ecoles', (query) => {
          query
            .wherePivot('role', 'PARENT')
            .wherePivot('statut', 'ACTIF')
        })
        .count('* as total'),

      Ecole
        .query()
        .where('statut', 'ACTIF')
        .count('* as total'),

      Ecole
        .query()
        .where('statut', 'SUSPENDU')
        .count('* as total'),

      Ecole
        .query()
        .where('statut', 'ARCHIVE')
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .where('statut', 'ACTIF')
        .count('* as total'),

    ])


    return {

      totalSchools:
        Number(schools[0].$extras.total),

      totalUsers:
        Number(users[0].$extras.total),

      totalStudents:
        Number(students[0].$extras.total),

      activeAdministrators:
        Number(administrators[0].$extras.total),

      activeTeachers:
        Number(teachers[0].$extras.total),

      activeParents:
        Number(parents[0].$extras.total),

      activeSchools:
        Number(activeSchools[0].$extras.total),

      suspendedSchools:
        Number(suspendedSchools[0].$extras.total),

      archivedSchools:
        Number(archivedSchools[0].$extras.total),

      activeUsers:
        Number(activeUsers[0].$extras.total),

    }

  }


  /**
   * ==========================================================================
   * ÉCOLES PAR STATUT
   * ==========================================================================
   */
  async getSchoolsByStatus() {

    const rows = await Ecole
      .query()
      .select('statut')
      .count('* as total')
      .groupBy('statut')


    return rows.map((row) => ({

      statut: row.statut,

      total:
        Number(row.$extras.total),

    }))

  }


  /**
   * ==========================================================================
   * UTILISATEURS PAR RÔLE
   * ==========================================================================
   */
  async getUsersByRole() {

    const [
      administrators,
      teachers,
      parents,
      students,
      total,
    ] = await Promise.all([

      User
        .query()
        .whereNull('deleted_at')
        .whereHas('ecoles', (query) => {
          query
            .wherePivot('role', 'ADMIN_ECOLE')
            .wherePivot('statut', 'ACTIF')
        })
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .whereHas('ecoles', (query) => {
          query
            .wherePivot('role', 'ENSEIGNANT')
            .wherePivot('statut', 'ACTIF')
        })
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .whereHas('ecoles', (query) => {
          query
            .wherePivot('role', 'PARENT')
            .wherePivot('statut', 'ACTIF')
        })
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .whereHas('ecoles', (query) => {
          query
            .wherePivot('role', 'ELEVE')
            .wherePivot('statut', 'ACTIF')
        })
        .count('* as total'),

      User
        .query()
        .whereNull('deleted_at')
        .count('* as total'),

    ])


    return {

      total:
        Number(total[0].$extras.total),

      admins:
        Number(administrators[0].$extras.total),

      teachers:
        Number(teachers[0].$extras.total),

      parents:
        Number(parents[0].$extras.total),

      students:
        Number(students[0].$extras.total),

    }

  }


  /**
   * ==========================================================================
   * DERNIÈRES ÉCOLES
   * ==========================================================================
   */
  async getRecentSchools(limit = 5) {

    const safeLimit = this.normalizeLimit(limit, 10, 50)


    const schools = await Ecole
      .query()
      .orderBy('created_at', 'desc')
      .limit(safeLimit)


    return Promise.all(
      schools.map((school) =>
        this.buildSchoolSummary(school)
      )
    )

  }


  /**
   * ==========================================================================
   * DERNIERS ADMINISTRATEURS
   * ==========================================================================
   */
  async getRecentAdministrators(limit = 5) {

    const safeLimit = this.normalizeLimit(limit, 10, 50)


    const administrators = await User
      .query()
      .whereNull('deleted_at')
      .whereHas('ecoles', (query) => {
        query
          .wherePivot('role', 'ADMIN_ECOLE')
          .wherePivot('statut', 'ACTIF')
      })
      .preload('ecoles', (query) => {

        query.pivotColumns([
          'role',
          'statut',
        ])

      })
      .orderBy('created_at', 'desc')
      .limit(safeLimit)


    return administrators.map((user) => ({

      id: user.id,

      nom: user.nom,

      postnom: user.postnom,

      prenom: user.prenom,

      email: user.email,

      statut: user.statut,

      createdAt: user.createdAt,

      ecoles: user.ecoles,

    }))

  }


  /**
   * ==========================================================================
   * TOP ÉCOLES
   * ==========================================================================
   *
   * Les écoles sont classées selon leur nombre d'élèves.
   * ==========================================================================
   */
  async getTopSchools(limit = 5) {

    const safeLimit = this.normalizeLimit(limit, 5, 50)


    const schools = await Ecole.all()


    const summaries = await Promise.all(
      schools.map((school) =>
        this.buildSchoolSummary(school)
      )
    )


    return summaries
      .sort(
        (a, b) =>
          b.nombreEleves - a.nombreEleves
      )
      .slice(0, safeLimit)

  }


  /**
   * ==========================================================================
   * STATISTIQUES DE TOUTES LES ÉCOLES
   * ==========================================================================
   */
  async getSchoolsWithStatistics() {

    const schools = await Ecole
      .query()
      .orderBy('created_at', 'desc')


    return Promise.all(
      schools.map((school) =>
        this.buildSchoolSummary(school)
      )
    )

  }


  /**
   * ==========================================================================
   * ACTIVITÉS RÉCENTES
   * ==========================================================================
   *
   * Pour l'instant, nous reconstruisons les activités à partir des créations
   * récentes d'écoles et d'utilisateurs.
   *
   * Une vraie table audit_logs remplacera cette méthode plus tard.
   * ==========================================================================
   */
  async getRecentActivities(limit = 10) {

    const safeLimit = this.normalizeLimit(limit, 10, 50)


    const [
      schools,
      users,
    ] = await Promise.all([

      Ecole
        .query()
        .orderBy('created_at', 'desc')
        .limit(safeLimit),

      User
        .query()
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .limit(safeLimit),

    ])


    const schoolActivities = schools.map((school) => ({

      type: 'school_created',

      date: school.createdAt,

      label:
        `École créée : ${school.nom}`,

      entityId: school.id,

    }))


    const userActivities = users.map((user) => ({

      type: 'user_created',

      date: user.createdAt,

      label:
        `Utilisateur créé : ${user.prenom} ${user.nom}`,

      entityId: user.id,

    }))


    return [
      ...schoolActivities,
      ...userActivities,
    ]
      .sort(
        (a, b) =>
          b.date.toMillis() - a.date.toMillis()
      )
      .slice(0, safeLimit)
      .map((activity) => ({

        ...activity,

        date:
          activity.date.toISO(),

      }))

  }


  /**
   * ==========================================================================
   * ÉVOLUTION MENSUELLE DES ÉCOLES
   * ==========================================================================
   */
  async getMonthlySchools(year: number) {

    const rows = await db
      .from('ecoles')
      .select(
        db.raw(
          'EXTRACT(MONTH FROM created_at)::int as month'
        )
      )
      .count('* as total')
      .whereRaw(
        'EXTRACT(YEAR FROM created_at) = ?',
        [year]
      )
      .groupByRaw(
        'EXTRACT(MONTH FROM created_at)'
      )
      .orderByRaw(
        'EXTRACT(MONTH FROM created_at)'
      )


    return this.fillMonths(rows)

  }


  /**
   * ==========================================================================
   * ÉVOLUTION MENSUELLE DES UTILISATEURS
   * ==========================================================================
   */
  async getMonthlyUsers(year: number) {

    const rows = await db
      .from('users')
      .select(
        db.raw(
          'EXTRACT(MONTH FROM created_at)::int as month'
        )
      )
      .count('* as total')
      .whereNull('deleted_at')
      .whereRaw(
        'EXTRACT(YEAR FROM created_at) = ?',
        [year]
      )
      .groupByRaw(
        'EXTRACT(MONTH FROM created_at)'
      )
      .orderByRaw(
        'EXTRACT(MONTH FROM created_at)'
      )


    return this.fillMonths(rows)

  }


  /**
   * ==========================================================================
   * SANTÉ DU SYSTÈME
   * ==========================================================================
   */
  async getSystemHealth() {

    const startedAt = Date.now()

    let database = 'ok'


    try {

      await db.rawQuery('SELECT 1')

    } catch {

      database = 'error'

    }


    const responseTimeMs =
      Date.now() - startedAt


    return {

      status:
        database === 'ok'
          ? 'healthy'
          : 'degraded',

      database,

      responseTimeMs,

      checkedAt:
        new Date().toISOString(),

    }

  }


  /**
   * ==========================================================================
   * RÉSUMÉ D'UNE ÉCOLE
   * ==========================================================================
   */
  private async buildSchoolSummary(
    school: Ecole
  ) {

    const [
      students,
      administrators,
      users,
    ] = await Promise.all([

      school
        .related('eleves')
        .query()
        .count('* as total'),

      school
        .related('utilisateurs')
        .query()
        .wherePivot('role', 'ADMIN_ECOLE')
        .wherePivot('statut', 'ACTIF')
        .count('* as total'),

      school
        .related('utilisateurs')
        .query()
        .wherePivot('statut', 'ACTIF')
        .count('* as total'),

    ])


    return {

      id: school.id,

      nom: school.nom,

      code: school.code,

      adresse: school.adresse,

      statut: school.statut,

      nombreEleves:
        Number(students[0].$extras.total),

      nombreAdministrateurs:
        Number(administrators[0].$extras.total),

      nombreUtilisateurs:
        Number(users[0].$extras.total),

      createdAt:
        school.createdAt.toISO(),

    }

  }


  /**
   * ==========================================================================
   * REMPLIR LES 12 MOIS
   * ==========================================================================
   */
  private fillMonths(rows: any[]) {

    const monthMap = new Map<number, number>()


    for (const row of rows) {

      monthMap.set(
        Number(row.month),
        Number(row.total)
      )

    }


    return Array
      .from({ length: 12 }, (_, index) => ({

        month:
          index + 1,

        total:
          monthMap.get(index + 1) ?? 0,

      }))

  }


  /**
   * ==========================================================================
   * NORMALISER UNE LIMITE
   * ==========================================================================
   */
  private normalizeLimit(
    value: number,
    fallback: number,
    maximum: number
  ) {

    const parsed =
      Number(value)


    if (
      !Number.isFinite(parsed) ||
      parsed < 1
    ) {

      return fallback

    }


    return Math.min(
      Math.floor(parsed),
      maximum
    )

  }

}