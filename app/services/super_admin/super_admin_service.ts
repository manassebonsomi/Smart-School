import User from '#models/user'
import { SystemRole } from '../../enums/system_role.ts'

export default class SuperAdminService {

  /**
   * Vérifie que l'utilisateur est un Super Administrateur.
   */
  ensureSuperAdmin(user: User) {
    if (user.systemRole !== SystemRole.SUPER_ADMIN) {
      throw new Error(
        'Cette opération est réservée au Super Administrateur.'
      )
    }

    return true
  }


  /**
   * Retourne les informations du Super Administrateur connecté.
   */
  async getProfile(user: User) {

    this.ensureSuperAdmin(user)

    // await user.load('ecoles')

    return {
      id: user.id,
      nom: user.nom,
      postnom: user.postnom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      systemRole: user.systemRole,
      statut: user.statut,
      isVerified: user.isVerified
    }
  }


  /**
   * Vérifie simplement les privilèges du compte.
   */
  async checkAccess(user: User) {

    this.ensureSuperAdmin(user)

    return {
      success: true,
      authorized: true,
      role: SystemRole.SUPER_ADMIN,
    }
  }
}