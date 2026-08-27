import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import Ecole from '#models/ecole'
import EcoleUser from '#models/ecole_user'
import UserContext from '#models/user_context'
import { DateTime } from 'luxon'
import VerifyEmailMail from '#mails/verify_email'
import { SystemRole } from '../../enums/system_role.ts'
export default class AdministrateurService {
  private verifyEmailMail = new VerifyEmailMail()
  async create(ecoleId: number, payload: any) {
    const trx = await db.transaction()
    try {
      const school = await Ecole.query({ client: trx }).where('id', ecoleId).first()
      if (!school) throw new Error("L'école sélectionnée n'existe pas.")
      const email = payload.email.trim().toLowerCase()
      if (await User.query({ client: trx }).where('email', email).first()) throw new Error('Cette adresse email existe déjà.')
      if (payload.telephone && await User.query({ client: trx }).where('telephone', payload.telephone).first()) throw new Error('Ce numéro de téléphone existe déjà.')
      const password = await hash.make(payload.password)
      const verificationToken = crypto.randomUUID()
      const user = new User()
      user.useTransaction(trx)
      user.merge({ nom: payload.nom, postnom: payload.postnom ?? null, prenom: payload.prenom, pseudo: payload.pseudo ?? null, email, telephone: payload.telephone ?? null, sexe: payload.sexe ?? null, password, statut: 'ACTIF', systemRole: SystemRole.USER, isVerified: false, token_verification: verificationToken, tokenVerificationExpiresAt: DateTime.now().plus({ hours: 24 }) })
      await user.save()
      const membership = new EcoleUser()
      membership.useTransaction(trx)
      membership.merge({ userId: user.id, ecoleId, role: 'ADMIN_ECOLE', statut: 'ACTIF' })
      await membership.save()
      const context = new UserContext()
      context.useTransaction(trx)
      context.merge({ userId: user.id, ecoleId, role: 'ADMIN_ECOLE', active: true })
      await context.save()
      await trx.commit()
      await this.verifyEmailMail.send(user, verificationToken)
      return { success: true, message: "Administrateur d'école créé avec succès.", data: this.serializeUser(user) }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
  async update(id: number, payload: any) {
    const user = await this.findAdmin(id)
    if (payload.email && payload.email.trim().toLowerCase() !== user.email) {
      const exists = await User.query().where('email', payload.email.trim().toLowerCase()).whereNot('id', id).first()
      if (exists) throw new Error('Cette adresse email existe déjà.')
    }
    if (payload.telephone && payload.telephone !== user.telephone) {
      const exists = await User.query().where('telephone', payload.telephone).whereNot('id', id).first()
      if (exists) throw new Error('Ce numéro de téléphone existe déjà.')
    }
    user.merge({ nom: payload.nom ?? user.nom, postnom: payload.postnom ?? user.postnom, prenom: payload.prenom ?? user.prenom, pseudo: payload.pseudo ?? user.pseudo, email: payload.email ? payload.email.trim().toLowerCase() : user.email, telephone: payload.telephone ?? user.telephone, sexe: payload.sexe ?? user.sexe, statut: payload.statut ?? user.statut })
    if (payload.password) user.password = await hash.make(payload.password)
    await user.save()
    return { success: true, message: 'Administrateur modifié avec succès.', data: this.serializeUser(user) }
  }
  async suspend(id: number) {
    const user = await this.findAdmin(id)
    user.statut = 'INACTIF'
    await user.save()
    await EcoleUser.query().where('user_id', id).where('role', 'ADMIN_ECOLE').update({ statut: 'INACTIF' })
    return { success: true, message: 'Administrateur suspendu.', data: this.serializeUser(user) }
  }
  async activate(id: number) {
    const user = await this.findAdmin(id)
    user.statut = 'ACTIF'
    await user.save()
    await EcoleUser.query().where('user_id', id).where('role', 'ADMIN_ECOLE').update({ statut: 'ACTIF' })
    return { success: true, message: 'Administrateur réactivé.', data: this.serializeUser(user) }
  }
  async delete(id: number) {
    const user = await this.findAdmin(id)
    user.statut = 'SUPPRIME'
    user.deletedAt = DateTime.now()
    await user.save()
    await EcoleUser.query().where('user_id', id).where('role', 'ADMIN_ECOLE').update({ statut: 'INACTIF' })
    return { success: true, message: 'Administrateur supprimé.' }
  }
  async findAll(page = 1, limit = 10, filters: any = {}) {
    const query = User.query().whereNull('deleted_at').whereHas('ecoles', builder => builder.wherePivot('role', 'ADMIN_ECOLE'))
    if (filters.search) query.where(builder => builder.whereILike('nom', `%${filters.search}%`).orWhereILike('prenom', `%${filters.search}%`).orWhereILike('postnom', `%${filters.search}%`).orWhereILike('email', `%${filters.search}%`))
    if (filters.statut) query.where('statut', filters.statut)
    const sortBy = ['nom', 'prenom', 'email', 'created_at'].includes(filters.sortBy) ? filters.sortBy : 'created_at'
    const order = filters.order === 'asc' ? 'asc' : 'desc'
    query.orderBy(sortBy, order)
    query.preload('ecoles', relation => relation.pivotColumns(['role', 'statut']))
    const result = await query.paginate(page, limit)
    const data = result.all().map(user => this.serializeUser(user))
    return { success: true, data: { meta: result.getMeta(), data } }
  }
  async getBySchool(ecoleId: number) {
    const school = await Ecole.find(ecoleId)
    if (!school) throw new Error("Cette école n'existe pas.")
    const users = await User.query().whereHas('ecoles', builder => builder.where('ecole_id', ecoleId).wherePivot('role', 'ADMIN_ECOLE')).whereNull('deleted_at').preload('ecoles', relation => relation.pivotColumns(['role', 'statut']))
    return { success: true, data: users.map(user => this.serializeUser(user)) }
  }
  async statistics() {
    const base = User.query().whereNull('deleted_at').whereHas('ecoles', builder => builder.wherePivot('role', 'ADMIN_ECOLE'))
    const total = await base.clone().count('* as total')
    const actifs = await base.clone().where('statut', 'ACTIF').count('* as total')
    const inactifs = await base.clone().where('statut', 'INACTIF').count('* as total')
    return { total: Number(total[0].$extras.total), actifs: Number(actifs[0].$extras.total), inactifs: Number(inactifs[0].$extras.total) }
  }
  async details(id: number) {
    const user = await this.findAdmin(id)
    await user.load('ecoles', relation => relation.pivotColumns(['role', 'statut']))
    return { success: true, data: this.serializeUser(user, true) }
  }
  async switchSchool(userId: number, ecoleId: number) {
    const context = await UserContext.query().where('user_id', userId).where('ecole_id', ecoleId).first()
    if (!context) throw new Error("Cet administrateur n'appartient pas à cette école.")
    await UserContext.query().where('user_id', userId).update({ active: false })
    context.active = true
    await context.save()
    return { success: true, message: "École active changée avec succès.", data: context }
  }
  async belongsToSchool(userId: number, ecoleId: number) {
    return !!(await EcoleUser.query().where('user_id', userId).where('ecole_id', ecoleId).where('role', 'ADMIN_ECOLE').where('statut', 'ACTIF').first())
  }
  async forceDelete(id: number) {
    const user = await this.findAdmin(id)
    const trx = await db.transaction()
    try {
      await EcoleUser.query({ client: trx }).where('user_id', id).delete()
      await UserContext.query({ client: trx }).where('user_id', id).delete()
      await user.useTransaction(trx).delete()
      await trx.commit()
      return { success: true, message: 'Administrateur supprimé définitivement.' }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
  async exists(id: number) {
    return !!(await User.query().where('id', id).whereHas('ecoles', builder => builder.wherePivot('role', 'ADMIN_ECOLE')).first())
  }
  private async findAdmin(id: number) {
    const user = await User.query().where('id', id).whereHas('ecoles', builder => builder.wherePivot('role', 'ADMIN_ECOLE')).first()
    if (!user) throw new Error('Administrateur introuvable.')
    return user
  }
  private serializeUser(user: User, details = false) {
    const item: any = { id: user.id, nom: user.nom, postnom: user.postnom, prenom: user.prenom, email: user.email, telephone: user.telephone, sexe: user.sexe, statut: user.statut, isVerified: user.isVerified, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt }
    if (details) item.ecoles = user.ecoles
    else if (user.ecoles) item.ecoles = user.ecoles
    return item
  }
}
