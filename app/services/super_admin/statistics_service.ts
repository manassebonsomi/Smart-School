import db from '@adonisjs/lucid/services/db'

import Ecole from '#models/ecole'
import User from '#models/user'
import EcoleUser from '#models/ecole_user'
import Eleve from '#models/eleve'


export default class StatisticsService {

  /**
   * ==========================================================================
   * STATISTIQUES GLOBALES
   * ==========================================================================
   */
  async getOverview(months = 12): Promise<any> {

    const period =
      this.normalizePeriod(months)


    const [
      overview,
      schoolStatus,
      usersByRole,
      monthly,
      activities,
    ] = await Promise.all([

      this.getOverviewKpis(),

      this.getSchoolStatus(),

      this.getUsersByRole(),

      this.getMonthlyEvolution(
        period
      ),

      this.getRecentActivities(10),

    ])


    return {

      success: true,

      data: {

        period,

        overview,

        schoolStatus,

        usersByRole,

        monthly,

        activities,

      },

    }

  }


  /**
   * ==========================================================================
   * KPI
   * ==========================================================================
   */
  private async getOverviewKpis(): Promise<any> {

    const [
      schools,
      activeSchools,
      suspendedSchools,
      archivedSchools,
      users,
      activeUsers,
      administrators,
      students,
    ] = await Promise.all([

      Ecole
        .query()
        .count('* as total'),

      Ecole
        .query()
        .where(
          'statut',
          'ACTIF'
        )
        .count('* as total'),

      Ecole
        .query()
        .where(
          'statut',
          'SUSPENDU'
        )
        .count('* as total'),

      Ecole
        .query()
        .where(
          'statut',
          'ARCHIVE'
        )
        .count('* as total'),

      User
        .query()
        .whereNull(
          'deleted_at'
        )
        .count('* as total'),

      User
        .query()
        .whereNull(
          'deleted_at'
        )
        .where(
          'statut',
          'ACTIF'
        )
        .count('* as total'),

      this.countUsersByMembershipRole(
        'ADMIN_ECOLE'
      ),

      Eleve
        .query()
        .count('* as total'),

    ])


    const totalUsers =
      Number(
        users[0].$extras.total
      )


    const activeUserCount =
      Number(
        activeUsers[0].$extras.total
      )


    return {

      totalSchools:
        Number(
          schools[0].$extras.total
        ),

      activeSchools:
        Number(
          activeSchools[0].$extras.total
        ),

      suspendedSchools:
        Number(
          suspendedSchools[0].$extras.total
        ),

      archivedSchools:
        Number(
          archivedSchools[0].$extras.total
        ),

      totalUsers,

      activeUsers:
        activeUserCount,

      activeUserRate:
        totalUsers > 0
          ? Number(
              (
                activeUserCount /
                totalUsers *
                100
              ).toFixed(1)
            )
          : 0,

      administrators:
        administrators,

      students:
        Number(
          students[0].$extras.total
        ),

    }

  }


  /**
   * ==========================================================================
   * ÉTAT DES ÉCOLES
   * ==========================================================================
   */
  async getSchoolStatus() {

    const rows =
      await Ecole
        .query()
        .select('statut')
        .count(
          '* as total'
        )
        .groupBy(
          'statut'
        )


    const result = {

      ACTIF: 0,

      SUSPENDU: 0,

      ARCHIVE: 0,

    }


    for (
      const row
      of rows
    ) {

      const status =
        String(
          row.statut || ''
        )


      if (
        Object.prototype.hasOwnProperty.call(
          result,
          status
        )
      ) {

        result[
          status as keyof typeof result
        ] =
          Number(
            row.$extras.total
          )

      }

    }


    return {

      labels: [
        'Actives',
        'Suspendues',
        'Archivées',
      ],

      values: [

        result.ACTIF,

        result.SUSPENDU,

        result.ARCHIVE,

      ],

      details: {

        actives:
          result.ACTIF,

        suspendues:
          result.SUSPENDU,

        archivees:
          result.ARCHIVE,

      },

    }

  }


  /**
   * ==========================================================================
   * UTILISATEURS PAR RÔLE
   * ==========================================================================
   *
   * On compte les utilisateurs distincts via ecole_users.
   */
  async getUsersByRole() {

    const [
      administrators,
      teachers,
      parents,
      students,
    ] = await Promise.all([

      this.countUsersByMembershipRole(
        'ADMIN_ECOLE'
      ),

      this.countUsersByMembershipRole(
        'ENSEIGNANT'
      ),

      this.countUsersByMembershipRole(
        'PARENT'
      ),

      this.countUsersByMembershipRole(
        'ELEVE'
      ),

    ])


    return {

      labels: [

        'Élèves',

        'Enseignants',

        'Parents',

        'Administrateurs',

      ],

      values: [

        students,

        teachers,

        parents,

        administrators,

      ],

      details: {

        students,

        teachers,

        parents,

        administrators,

      },

    }

  }


  /**
   * ==========================================================================
   * ÉVOLUTION MENSUELLE
   * ==========================================================================
   */
  async getMonthlyEvolution(
    months = 12
  ) {

    const period =
      this.normalizePeriod(
        months
      )


    const startDate =
      new Date()


    startDate.setDate(
      1
    )

    startDate.setMonth(
      startDate.getMonth() -
      (period - 1)
    )


    const startIso =
      startDate
        .toISOString()
        .slice(
          0,
          10
        )


    /**
     * Écoles créées
     */
    const schoolRows =
      await db
        .from('ecoles')
        .select(
          db.raw(
            'EXTRACT(MONTH FROM created_at)::int as month'
          ),
          db.raw(
            'EXTRACT(YEAR FROM created_at)::int as year'
          ),
          db.raw(
            'COUNT(*)::int as total'
          )
        )
        .where(
          'created_at',
          '>=',
          startIso
        )
        .groupBy(
          'year',
          'month'
        )
        .orderBy(
          'year'
        )
        .orderBy(
          'month'
        )


    /**
     * Utilisateurs créés
     */
    const userRows =
      await db
        .from('users')
        .select(
          db.raw(
            'EXTRACT(MONTH FROM created_at)::int as month'
          ),
          db.raw(
            'EXTRACT(YEAR FROM created_at)::int as year'
          ),
          db.raw(
            'COUNT(*)::int as total'
          )
        )
        .where(
          'created_at',
          '>=',
          startIso
        )
        .whereNull(
          'deleted_at'
        )
        .groupBy(
          'year',
          'month'
        )
        .orderBy(
          'year'
        )
        .orderBy(
          'month'
        )


    /**
     * Administrateurs créés
     */
    const administratorRows =
      await db
        .from('users')
        .join(
          'ecole_users',
          'ecole_users.user_id',
          'users.id'
        )
        .select(
          db.raw(
            'EXTRACT(MONTH FROM users.created_at)::int as month'
          ),
          db.raw(
            'EXTRACT(YEAR FROM users.created_at)::int as year'
          ),
          db.raw(
            'COUNT(DISTINCT users.id)::int as total'
          )
        )
        .where(
          'users.created_at',
          '>=',
          startIso
        )
        .whereNull(
          'users.deleted_at'
        )
        .where(
          'ecole_users.role',
          'ADMIN_ECOLE'
        )
        .groupBy(
          'year',
          'month'
        )
        .orderBy(
          'year'
        )
        .orderBy(
          'month'
        )


    const labels = []
    const schoolTotals = []
    const userTotals = []
    const administratorTotals = []


    const schoolMap =
      this.buildMonthMap(
        schoolRows
      )


    const userMap =
      this.buildMonthMap(
        userRows
      )


    const administratorMap =
      this.buildMonthMap(
        administratorRows
      )


    for (
      let index = 0;
      index < period;
      index++
    ) {

      const date =
        new Date(
          startDate
        )


      date.setMonth(
        startDate.getMonth() +
        index
      )


      const year =
        date.getFullYear()


      const month =
        date.getMonth() + 1


      const key =
        `${year}-${month}`


      labels.push(

        date.toLocaleDateString(
          'fr-FR',
          {
            month: 'short',
          }
        )

      )


      schoolTotals.push(
        schoolMap.get(key) ?? 0
      )


      userTotals.push(
        userMap.get(key) ?? 0
      )


      administratorTotals.push(
        administratorMap.get(key) ?? 0
      )

    }


    return {

      labels,

      schools:
        schoolTotals,

      users:
        userTotals,

      administrators:
        administratorTotals,

    }

  }


  /**
   * ==========================================================================
   * ACTIVITÉS RÉCENTES
   * ==========================================================================
   */
  async getRecentActivities(
    limit = 10
  ) {

    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) || 10,
          1
        ),
        50
      )


    const [
      schools,
      users,
    ] = await Promise.all([

      Ecole
        .query()
        .orderBy(
          'created_at',
          'desc'
        )
        .limit(
          safeLimit
        ),

      User
        .query()
        .whereNull(
          'deleted_at'
        )
        .orderBy(
          'created_at',
          'desc'
        )
        .limit(
          safeLimit
        ),

    ])


    const schoolActivities =
      schools.map(
        school => ({

          type:
            'school_created',

          date:
            school.createdAt,

          title:
            'Nouvelle école enregistrée',

          description:
            school.nom,

          icon:
            'fa-school',

          iconClass:
            'bg-sky-50 text-sky-600',

        })
      )


    const userActivities =
      users.map(
        user => ({

          type:
            'user_created',

          date:
            user.createdAt,

          title:
            'Nouveau compte utilisateur',

          description:
            `${user.prenom || ''} ${user.nom || ''}`.trim(),

          icon:
            'fa-user-plus',

          iconClass:
            'bg-indigo-50 text-indigo-600',

        })
      )


    return [
      ...schoolActivities,
      ...userActivities,
    ]

      .sort(
        (a, b) =>
          b.date.toMillis() -
          a.date.toMillis()
      )

      .slice(
        0,
        safeLimit
      )

  }


  /**
   * ==========================================================================
   * NOMBRE D'UTILISATEURS DISTINCTS PAR RÔLE
   * ==========================================================================
   */
  private async countUsersByMembershipRole(
    role: string
  ) {

    const result =
      await EcoleUser
        .query()
        .where(
          'role',
          role
        )
        .where(
          'statut',
          'ACTIF'
        )
        .countDistinct(
          'user_id as total'
        )


    return Number(
      result[0].$extras.total
    )

  }


  /**
   * ==========================================================================
   * NORMALISER LA PÉRIODE
   * ==========================================================================
   */
  private normalizePeriod(
    months: number
  ) {

    const value =
      Number(months)


    if (
      ![1, 3, 6, 12].includes(
        value
      )
    ) {

      return 12

    }


    return value

  }


  /**
   * ==========================================================================
   * CONSTRUIRE LA MAP MENSUELLE
   * ==========================================================================
   */
  private buildMonthMap(
    rows: any[]
  ) {

    const map =
      new Map<string, number>()


    for (
      const row
      of rows
    ) {

      const key =
        `${Number(row.year)}-${Number(row.month)}`


      map.set(
        key,
        Number(row.total)
      )

    }


    return map

  }

}