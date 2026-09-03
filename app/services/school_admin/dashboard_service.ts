import EcoleUser from '#models/ecole_user'
import Eleve from '#models/eleve'
import UserContext from '#models/user_context'

export default class DashboardService {
  async getContext(userId: number) {
    const context = await UserContext.query()
      .where('user_id', userId)
      .where('active', true)
      .preload('ecole')
      .first()

    if (!context || !context.ecole) {
      throw new Error(
        'Aucune école active n’est disponible pour cet utilisateur.'
      )
    }

    return context
  }

  async getDashboard(userId: number) {
    const context = await this.getContext(userId)
    const schoolId = context.ecoleId

    const [students, classes, subjects, users] = await Promise.all([
      Eleve.query()
        .where('ecole_id', schoolId)
        .count('* as total'),

      context.ecole
        .related('classes')
        .query()
        .count('* as total'),

      context.ecole
        .related('matieres')
        .query()
        .count('* as total'),

      EcoleUser.query()
        .where('ecole_id', schoolId)
        .count('* as total'),
    ])

    const [teachers, parents, administrators] = await Promise.all([
      EcoleUser.query()
        .where('ecole_id', schoolId)
        .where('role', 'ENSEIGNANT')
        .count('* as total'),

      EcoleUser.query()
        .where('ecole_id', schoolId)
        .where('role', 'PARENT')
        .count('* as total'),

      EcoleUser.query()
        .where('ecole_id', schoolId)
        .where('role', 'ADMIN_ECOLE')
        .count('* as total'),
    ])

    return {
      success: true,

      data: {
        ecole: {
          id: context.ecole.id,
          nom: context.ecole.nom,
          code: context.ecole.code,
          ville: context.ecole.ville,
          pays: context.ecole.pays,
          logo: context.ecole.logo,
          statut: context.ecole.statut,
        },

        contexte: {
          id: context.id,
          role: context.role,
          active: context.active,
        },

        statistiques: {
          eleves: Number(students[0].$extras.total || 0),
          classes: Number(classes[0].$extras.total || 0),
          matieres: Number(subjects[0].$extras.total || 0),
          utilisateurs: Number(users[0].$extras.total || 0),
          enseignants: Number(teachers[0].$extras.total || 0),
          parents: Number(parents[0].$extras.total || 0),
          administrateurs: Number(
            administrators[0].$extras.total || 0
          ),
        },

        capacites: {
          presences: null,
          performanceAcademique: null,
          activitesRecentes: [],
          evenements: [],
        },
      },
    }
  }

  async getSchools(userId: number) {
  const rows = await EcoleUser
    .query()
    .where('user_id', userId)
    .where('role', 'ADMIN_ECOLE')
    .where('statut', 'ACTIF')
    .preload('ecole')

  return rows
    .filter(
      (row) =>
        row.ecole &&
        row.ecole.statut === 'ACTIF'
    )
    .map((row) => ({
      id: row.ecole.id,
      nom: row.ecole.nom,
      code: row.ecole.code,
      ville: row.ecole.ville,
      role: row.role,
      statut: row.statut,
    }))
}

  async getActiveSchool(userId: number) {
    const context = await this.getContext(userId)

    return {
      id: context.ecole.id,
      nom: context.ecole.nom,
      code: context.ecole.code,
      ville: context.ecole.ville,
      pays: context.ecole.pays,
      logo: context.ecole.logo,
      role: context.role,
    }
  }
}