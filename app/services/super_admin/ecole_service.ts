import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import Ecole from '#models/ecole'
import User from '#models/user'
import EcoleUser from '#models/ecole_user'
import UserContext from '#models/user_context'
import { DateTime } from 'luxon'
import VerifyEmailMail from '#mails/verify_email'
import { SystemRole } from '../../enums/system_role.ts'
export default class EcoleService {
  private verifyEmailMail = new VerifyEmailMail()
  async create(payload: any) {
    const trx = await db.transaction()
    try {
      const code = payload.code?.trim() || await this.generateCode()
      await this.assertUniqueSchool({ ...payload, code })
      const ecole = new Ecole()
      ecole.useTransaction(trx)
      ecole.merge({ nom: payload.nom, code, description: payload.description ?? null, email: payload.email ?? null, telephone: payload.telephone ?? null, adresse: payload.adresse ?? null, ville: payload.ville ?? null, pays: payload.pays ?? 'République démocratique du Congo', province: payload.province ?? null, commune: payload.commune ?? null, quartier: payload.quartier ?? null, siteWeb: payload.siteWeb ?? null, type: payload.type ?? null, anneeCreation: payload.anneeCreation ?? null, logo: payload.logo ?? null, statut: payload.statut ?? 'ACTIF' })
      await ecole.save()
      let administrator: any = null
      if (payload.admin) {
        const admin = payload.admin
        const email = admin.email.trim().toLowerCase()
        if (await User.query({ client: trx }).where('email', email).first()) throw new Error('L’adresse email de l’administrateur existe déjà.')
        if (admin.telephone && await User.query({ client: trx }).where('telephone', admin.telephone).first()) throw new Error('Le téléphone de l’administrateur existe déjà.')
        const user = new User()
        user.useTransaction(trx)
        user.merge({ nom: admin.nom, prenom: admin.prenom, postnom: admin.postnom ?? null, pseudo: admin.pseudo ?? null, email, telephone: admin.telephone ?? null, sexe: admin.sexe ?? null, password: await hash.make(admin.password), statut: 'ACTIF', systemRole: SystemRole.USER, isVerified: false, token_verification: crypto.randomUUID(), tokenVerificationExpiresAt: DateTime.now().plus({ hours: 24 }) })
        await user.save()
        const membership = new EcoleUser()
        membership.useTransaction(trx)
        membership.merge({ userId: user.id, ecoleId: ecole.id, role: 'ADMIN_ECOLE', statut: 'ACTIF' })
        await membership.save()
        const context = new UserContext()
        context.useTransaction(trx)
        context.merge({ userId: user.id, ecoleId: ecole.id, role: 'ADMIN_ECOLE', active: true })
        await context.save()
        administrator = user
      }
      await trx.commit()
      if (administrator) await this.verifyEmailMail.send(administrator, administrator.token_verification!)
      return { success: true, message: 'École créée avec succès.', data: await this.formatSchool(ecole) }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
  async findById(id: number) {
    const ecole = await Ecole.find(id)
    if (!ecole) throw new Error("Cette école n'existe pas.")
    return ecole
  }
  async update(id: number, payload: any) {
    const ecole = await this.findById(id)
    if (payload.code && payload.code !== ecole.code) await this.validateUniqueCode(payload.code, id)
    if (payload.email && payload.email !== ecole.email) await this.validateUniqueEmail(payload.email, id)
    ecole.merge({ nom: payload.nom ?? ecole.nom, code: payload.code ?? ecole.code, description: payload.description ?? ecole.description, adresse: payload.adresse ?? ecole.adresse, telephone: payload.telephone ?? ecole.telephone, email: payload.email ?? ecole.email, ville: payload.ville ?? ecole.ville, pays: payload.pays ?? ecole.pays, province: payload.province ?? ecole.province, commune: payload.commune ?? ecole.commune, quartier: payload.quartier ?? ecole.quartier, siteWeb: payload.siteWeb ?? ecole.siteWeb, type: payload.type ?? ecole.type, anneeCreation: payload.anneeCreation ?? ecole.anneeCreation, logo: payload.logo ?? ecole.logo, statut: payload.statut ?? ecole.statut })
    await ecole.save()
    return { success: true, message: 'École modifiée avec succès.', data: await this.formatSchool(ecole) }
  }
  async suspend(id: number) { return this.setStatus(id, 'SUSPENDU', 'École suspendue avec succès.') }
  async activate(id: number) { return this.setStatus(id, 'ACTIF', 'École réactivée avec succès.') }
  async archive(id: number) { return this.setStatus(id, 'ARCHIVE', 'École archivée avec succès.') }
  async delete(id: number) { return this.setStatus(id, 'ARCHIVE', 'École supprimée avec succès.') }
  async findAll(page = 1, limit = 10, filters: any = {}) {
    const query = Ecole.query()
    if (filters.search) query.where(builder => builder.whereILike('nom', `%${filters.search}%`).orWhereILike('code', `%${filters.search}%`).orWhereILike('email', `%${filters.search}%`).orWhereILike('ville', `%${filters.search}%`).orWhereILike('province', `%${filters.search}%`))
    if (filters.statut) query.where('statut', filters.statut)
    const sortBy = ['nom', 'code', 'created_at'].includes(filters.sortBy) ? filters.sortBy : 'created_at'
    query.orderBy(sortBy, filters.order === 'asc' ? 'asc' : 'desc')
    const result = await query.paginate(page, limit)
    const data = await Promise.all(result.all().map(ecole => this.formatSchool(ecole)))
    return { success: true, data: { meta: result.getMeta(), data } }
  }
  async search(keyword = '') { const rows = await Ecole.query().where(builder => builder.whereILike('nom', `%${keyword}%`).orWhereILike('code', `%${keyword}%`).orWhereILike('email', `%${keyword}%`)).orderBy('nom', 'asc'); return { success: true, data: await Promise.all(rows.map(row => this.formatSchool(row))) } }
  async details(id: number) {
    const ecole = await Ecole.query().where('id', id).preload('utilisateurs', query => query.pivotColumns(['role', 'statut'])).preload('eleves').preload('classes').preload('niveaux').preload('matieres').first()
    if (!ecole) throw new Error("Cette école n'existe pas.")
    return { success: true, data: await this.formatSchool(ecole, true) }
  }
  async countByStatus() {
    const count = async (statut?: string) => Number((statut ? await Ecole.query().where('statut', statut).count('* as total') : await Ecole.query().count('* as total'))[0].$extras.total)
    return { total: await count(), actives: await count('ACTIF'), suspendues: await count('SUSPENDU'), archivees: await count('ARCHIVE') }
  }
  async canDelete(id: number) {
    const ecole = await this.findById(id)
    const [utilisateurs, eleves, classes] = await Promise.all([ecole.related('utilisateurs').query().count('* as total'), ecole.related('eleves').query().count('* as total'), ecole.related('classes').query().count('* as total')])
    const counts = { utilisateurs: Number(utilisateurs[0].$extras.total), eleves: Number(eleves[0].$extras.total), classes: Number(classes[0].$extras.total) }
    return { canDelete: counts.utilisateurs === 0 && counts.eleves === 0 && counts.classes === 0, informations: counts }
  }
  async statistics(id: number) {
    const ecole = await this.findById(id)
    const [eleves, classes, utilisateurs, niveaux, matieres] = await Promise.all([ecole.related('eleves').query().count('* as total'), ecole.related('classes').query().count('* as total'), ecole.related('utilisateurs').query().count('* as total'), ecole.related('niveaux').query().count('* as total'), ecole.related('matieres').query().count('* as total')])
    return { success: true, data: { ecole: await this.formatSchool(ecole), eleves: Number(eleves[0].$extras.total), classes: Number(classes[0].$extras.total), utilisateurs: Number(utilisateurs[0].$extras.total), niveaux: Number(niveaux[0].$extras.total), matieres: Number(matieres[0].$extras.total) } }
  }
  async exists(id: number) { return !!(await Ecole.find(id)) }
  private async setStatus(id: number, statut: string, message: string) { const ecole = await this.findById(id); ecole.statut = statut; await ecole.save(); return { success: true, message, data: await this.formatSchool(ecole) } }
  private async generateCode() {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = `SCH-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`
      if (!(await Ecole.query().where('code', code).first())) return code
    }
    throw new Error('Impossible de générer un code école unique.')
  }
  private async assertUniqueSchool(payload: any) { await this.validateUniqueCode(payload.code); if (payload.email) await this.validateUniqueEmail(payload.email); if (payload.telephone) await this.validateUniqueTelephone(payload.telephone) }
  private async validateUniqueCode(code: string, exceptId?: number) { const query = Ecole.query().where('code', code); if (exceptId) query.whereNot('id', exceptId); if (await query.first()) throw new Error('Ce code école existe déjà.') }
  private async validateUniqueEmail(email: string, exceptId?: number) { const query = Ecole.query().where('email', email); if (exceptId) query.whereNot('id', exceptId); if (await query.first()) throw new Error('Cette adresse email existe déjà pour une école.') }
  private async validateUniqueTelephone(telephone: string) { if (await Ecole.query().where('telephone', telephone).first()) throw new Error('Ce numéro de téléphone existe déjà pour une école.') }
  private async formatSchool(ecole: Ecole, details = false) {
    const [eleves, admins] = await Promise.all([ecole.related('eleves').query().count('* as total'), ecole.related('utilisateurs').query().wherePivot('role', 'ADMIN_ECOLE').wherePivot('statut', 'ACTIF').count('* as total')])
    const item: any = { id: ecole.id, nom: ecole.nom, code: ecole.code, description: ecole.description, email: ecole.email, telephone: ecole.telephone, adresse: ecole.adresse, ville: ecole.ville, pays: ecole.pays, province: ecole.province, commune: ecole.commune, quartier: ecole.quartier, siteWeb: ecole.siteWeb, type: ecole.type, anneeCreation: ecole.anneeCreation, logo: ecole.logo, statut: ecole.statut, createdAt: ecole.createdAt, updatedAt: ecole.updatedAt, nombreEleves: Number(eleves[0].$extras.total), nombreAdministrateurs: Number(admins[0].$extras.total) }
    if (details) { item.utilisateurs = ecole.utilisateurs; item.eleves = ecole.eleves; item.classes = ecole.classes; item.niveaux = ecole.niveaux; item.matieres = ecole.matieres }
    return item
  }
}
