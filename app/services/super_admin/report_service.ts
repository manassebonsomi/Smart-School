import db from '@adonisjs/lucid/services/db'
import DashboardService from '#services/super_admin/dashboard_service'
import Ecole from '#models/ecole'
export default class ReportService {
  private dashboard = new DashboardService()
  async list(filters: any = {}) {
    const types = ['schools', 'users', 'students', 'platform']
    const requested = filters.type && types.includes(filters.type) ? filters.type : null
    const reports = [
      { id: 'schools-overview', type: 'schools', name: 'Synthèse des écoles', description: 'Situation et évolution des établissements.', format: 'csv' },
      { id: 'users-overview', type: 'users', name: 'Synthèse des utilisateurs', description: 'Administrateurs, enseignants, élèves et parents.', format: 'csv' },
      { id: 'students-overview', type: 'students', name: 'Synthèse des élèves', description: 'Répartition globale des élèves.', format: 'csv' },
      { id: 'platform-overview', type: 'platform', name: 'Rapport global de la plateforme', description: 'Indicateurs principaux de Smart School.', format: 'csv' },
    ]
    return { success: true, data: requested ? reports.filter(report => report.type === requested) : reports }
  }
  async generate(type: string) {
    if (!['schools', 'users', 'students', 'platform'].includes(type)) throw new Error('Type de rapport invalide.')
    return { success: true, data: { id: `${type}-${Date.now()}`, type, name: this.label(type), generatedAt: new Date().toISOString(), status: 'READY', format: 'csv' }, message: 'Rapport généré avec succès.' }
  }
  async download(type: string) {
    let rows: string[][] = []
    if (type === 'schools') {
      const schools = await Ecole.query().orderBy('nom', 'asc')
      rows = [['ID', 'Nom', 'Code', 'Province', 'Ville', 'Statut', 'Créée le']]
      schools.forEach(item => rows.push([String(item.id), item.nom, item.code, item.province ?? '', item.ville ?? '', item.statut, item.createdAt.toISO() ?? '']))
    } else if (type === 'users') {
      const users = await db.from('users').whereNull('deleted_at').orderBy('created_at', 'asc').select(['id', 'prenom', 'nom', 'email', 'telephone', 'statut', 'system_role', 'created_at'])
      rows = [['ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Statut', 'Rôle système', 'Créé le']]
      users.forEach(item => rows.push([String(item.id), item.prenom, item.nom, item.email, item.telephone ?? '', item.statut, item.system_role, new Date(item.created_at).toISOString()]))
    } else if (type === 'students') {
      const students = await db.from('eleves').select(['id', 'matricule', 'nom', 'prenom', 'statut', 'created_at']).orderBy('created_at', 'asc')
      rows = [['ID', 'Matricule', 'Nom', 'Prénom', 'Statut', 'Créé le']]
      students.forEach(item => rows.push([String(item.id), item.matricule, item.nom, item.prenom, item.statut, new Date(item.created_at).toISOString()]))
    } else {
      const statistics = await this.dashboard.getStatistics()
      rows = [['Indicateur', 'Valeur'], ['Écoles', String(statistics.totalSchools)], ['Écoles actives', String(statistics.activeSchools)], ['Écoles suspendues', String(statistics.suspendedSchools)], ['Utilisateurs', String(statistics.totalUsers)], ['Élèves', String(statistics.totalStudents)], ['Administrateurs actifs', String(statistics.activeAdministrators)]]
    }
    return rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  }
  private label(type: string) { return { schools: 'Synthèse des écoles', users: 'Synthèse des utilisateurs', students: 'Synthèse des élèves', platform: 'Rapport global de la plateforme' }[type as 'schools' | 'users' | 'students' | 'platform'] }
}
