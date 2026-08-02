import db from '@adonisjs/lucid/services/db'
import Ecole from '#models/ecole'
import User from '#models/user'
import Eleve from '#models/eleve'
import Classe from '#models/classe'
import Matiere from '#models/matiere'
import Niveau from '#models/niveau'
import EcoleUser from '#models/ecole_user'

export default class DashboardService {

  /**
   * ============================================================================
   * Dashboard principal
   * ============================================================================
   */
  async getDashboard() {

    const statistics = await this.getStatistics()
    const schoolsByStatus = await this.getSchoolsByStatus()
    const usersByRole = await this.getUsersByRole()

    return {
      success: true,
      data: {
        statistics,
        schoolsByStatus,
        usersByRole,
      }
    }

  }

  /**
   * ============================================================================
   * Statistiques générales
   * ============================================================================
   */
  async getStatistics() {

    const totalSchools = await Ecole.query().count('* as total')
    const activeSchools = await Ecole.query().where('statut', 'ACTIF').count('* as total')
    const suspendedSchools = await Ecole.query().where('statut', 'SUSPENDU').count('* as total')
    const archivedSchools = await Ecole.query().where('statut', 'ARCHIVE').count('* as total')
    const totalUsers = await User.query().count('* as total')
    const activeUsers = await User.query().where('statut', 'ACTIF').count('* as total')
    const totalStudents = await Eleve.query().count('* as total')
    const totalClasses = await Classe.query().count('* as total')
    const totalSubjects = await Matiere.query().count('* as total')
    const totalLevels = await Niveau.query().count('* as total')

    return {
      schools: {
        total: Number(totalSchools[0].$extras.total),
        active: Number(activeSchools[0].$extras.total),
        suspended: Number(suspendedSchools[0].$extras.total),
        archived: Number(archivedSchools[0].$extras.total),

      },

      users: {
        total: Number(totalUsers[0].$extras.total),
        active: Number(activeUsers[0].$extras.total),
      },

      students: Number(totalStudents[0].$extras.total),
      classes: Number(totalClasses[0].$extras.total),
      subjects: Number(totalSubjects[0].$extras.total),
      levels: Number(totalLevels[0].$extras.total),

    }

  }

  /**
   * ============================================================================
   * Répartition des écoles selon leur statut
   * ============================================================================
   */
  async getSchoolsByStatus() {

    const result = await Ecole.query().select('statut').count('* as total').groupBy('statut')
    return result.map((item) => ({
      statut: item.statut,
      total: Number(item.$extras.total),
    }))

  }

  /**
   * ============================================================================
   * Répartition des utilisateurs par rôle
   * ============================================================================
   */
  async getUsersByRole() {

    const result = await EcoleUser.query().select('role').count('* as total').groupBy('role')

    return result.map((item) => ({
      role: item.role,
      total: Number(item.$extras.total),
    }))

  }

    /**
   * ============================================================================
   * Dernières écoles créées
   * ============================================================================
   */
  async getRecentSchools(limit: number = 10) {

    const ecoles = await Ecole.query().orderBy('created_at', 'desc').limit(limit)
    return ecoles

  }

  /**
   * ============================================================================
   * Derniers administrateurs créés
   * ============================================================================
   */
  async getRecentAdministrators(limit: number = 10) {

    const administrateurs = await User.query().whereHas('ecoles', (query) => {
        query.wherePivot('role', 'ADMIN_ECOLE')
      }).preload('ecoles').orderBy('created_at', 'desc').limit(limit)

    return administrateurs

  }

  /**
   * ============================================================================
   * Liste des écoles avec statistiques
   * ============================================================================
   */
  async getSchoolsWithStatistics() {

    const ecoles = await Ecole.query().preload('classes').preload('eleves').preload('matieres').preload('niveaux').preload('utilisateurs')

    return ecoles.map((ecole) => ({
      id: ecole.id,
      nom: ecole.nom,
      code: ecole.code,
      statut: ecole.statut,
      classes: ecole.classes.length,
      eleves: ecole.eleves.length,
      matieres: ecole.matieres.length,
      niveaux: ecole.niveaux.length,
      utilisateurs: ecole.utilisateurs.length,
      createdAt: ecole.createdAt
    }))

  }

  /**
   * ============================================================================
   * Top écoles selon le nombre d'élèves
   * ============================================================================
   */
  async getTopSchools(limit: number = 5) {

    const ecoles = await Ecole.query().preload('eleves')
    return ecoles
      .map((ecole) => ({
        id: ecole.id,
        nom: ecole.nom,
        totalEleves: ecole.eleves.length
      })).sort((a, b) => b.totalEleves - a.totalEleves).slice(0, limit)
  }

  /**
   * ============================================================================
   * Activités récentes
   * ============================================================================
   *
   * À remplacer plus tard par la table audit_logs.
   * ============================================================================
   */
  async getRecentActivities(limit: number = 10) {

    const ecoles = await Ecole.query().orderBy('created_at', 'desc').limit(limit)

    return ecoles.map((ecole) => ({
      type: 'ECOLE',
      action: 'CREATION',
      description: `Nouvelle école créée : ${ecole.nom}`,
      createdAt: ecole.createdAt
    }))

  }

    /**
   * ============================================================================
   * Evolution mensuelle des écoles
   * ============================================================================
   */
  async getMonthlySchools(year: number = new Date().getFullYear()) {

    const result = await db.from('ecoles').select(db.raw('EXTRACT(MONTH FROM created_at) as mois'))
      .count('* as total')
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
      .groupByRaw('EXTRACT(MONTH FROM created_at)')
      .orderByRaw('EXTRACT(MONTH FROM created_at)')
    return result

  }

  /**
   * ============================================================================
   * Evolution mensuelle des utilisateurs
   * ============================================================================
   */
  async getMonthlyUsers(year: number = new Date().getFullYear()) {

    const result = await db.from('users').select(db.raw('EXTRACT(MONTH FROM created_at) as mois'))
      .count('* as total')
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
      .groupByRaw('EXTRACT(MONTH FROM created_at)')
      .orderByRaw('EXTRACT(MONTH FROM created_at)')

    return result

  }

  /**
   * ============================================================================
   * Santé du système
   * ============================================================================
   */
  async getSystemHealth() {
    const totalSchools = await Ecole.query().count('* as total')
    const totalUsers = await User.query().count('* as total')
    const totalStudents = await Eleve.query().count('* as total')

    return {
      database: "ONLINE",
      api: "ONLINE",
      version: "1.0.0",
      uptime: process.uptime(),
      schools: Number(totalSchools[0].$extras.total),
      users: Number(totalUsers[0].$extras.total),
      students: Number(totalStudents[0].$extras.total),
      memory: process.memoryUsage()
    }

  }


  /**
   * ============================================================================
   * Dashboard complet
   * ============================================================================
   */
  async getFullDashboard() {

    const [
      statistics,
      schoolsByStatus,
      usersByRole,
      recentSchools,
      recentAdministrators,
      schoolsStatistics,
      topSchools,
      monthlySchools,
      monthlyUsers,
      health,
      activities,
    ] = await Promise.all([

      this.getStatistics(),
      this.getSchoolsByStatus(),
      this.getUsersByRole(),
      this.getRecentSchools(),
      this.getRecentAdministrators(),
      this.getSchoolsWithStatistics(),
      this.getTopSchools(),
      this.getMonthlySchools(),
      this.getMonthlyUsers(),
      this.getSystemHealth(),
      this.getRecentActivities(),

    ])


    return {

      success: true,
      data: {
        statistics,
        schoolsByStatus,
        usersByRole,
        recentSchools,
        recentAdministrators,
        schoolsStatistics,
        topSchools,
        monthlySchools,
        monthlyUsers,
        health,
        recentActivities: activities,
      }
    }

  }

}