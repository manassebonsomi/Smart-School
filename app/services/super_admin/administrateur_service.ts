import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import EcoleUser from '#models/ecole_user'
import UserContext from '#models/user_context'
import { DateTime } from 'luxon'
import VerifyEmailMail from '#mails/verify_email'


export default class AdministrateurService {

  private verifyEmailMail = new VerifyEmailMail()


  /**
   * ============================================================================
   * Créer un administrateur d'école
   * ============================================================================
   */
  async create(ecoleId: number, payload: any) {

    const trx = await db.transaction()

    try {

      await this.validateEmail(payload.email)

      if (payload.telephone) {
        await this.validateTelephone(payload.telephone)
      }

      const password = await hash.make(payload.password)
      const verificationToken = crypto.randomUUID()

      /**
       * Création du compte utilisateur
       */
      const user = await User.create({
        nom: payload.nom,
        postnom: payload.postnom,
        prenom: payload.prenom,
        pseudo: payload.pseudo,
        email: payload.email,
        telephone: payload.telephone,
        sexe: payload.sexe,
        password,
        statut: 'ACTIF',
        isVerified: false,
        token_verification: verificationToken,
        tokenVerificationExpiresAt: DateTime.now().plus({hours:24})

      }, {
        client: trx
      })

      /**
       * Association utilisateur-école
       */
      await EcoleUser.create({
        userId: user.id,
        ecoleId,
        role: 'ADMIN_ECOLE',
        statut: 'ACTIF'

      }, {
        client: trx
      })

      /**
       * Création du contexte utilisateur
       */
      await UserContext.create({
        userId: user.id,
        ecoleId,
        role: 'ADMIN_ECOLE',
        active: true

      }, {
        client: trx
      })

      await trx.commit()

      await this.verifyEmailMail.send(user, verificationToken)

      return {
        success: true,
        message: "Administrateur d'école créé avec succès.",
        data: user

      }

    } catch(error) {

      await trx.rollback()
      throw error

    }

  }

    /**
   * ============================================================================
   * Modifier un administrateur
   * ============================================================================
   */
  async update(id: number, payload: any) {

    const trx = await db.transaction()

    try {

      const user = await User.query({ client: trx }).where('id', id).first()

      if (!user) {
        throw new Error("Administrateur introuvable.")
      }

      if (payload.email && payload.email !== user.email) {
        await this.validateEmail(payload.email)
      }

      if (payload.telephone && payload.telephone !== user.telephone) {
        await this.validateTelephone(payload.telephone)
      }

      user.merge({
        nom: payload.nom ?? user.nom,
        postnom: payload.postnom ?? user.postnom,
        prenom: payload.prenom ?? user.prenom,
        pseudo: payload.pseudo ?? user.pseudo,
        email: payload.email ?? user.email,
        telephone: payload.telephone ?? user.telephone,
        sexe: payload.sexe ?? user.sexe,
      })

      if(payload.password){
        user.password = await hash.make(
          payload.password
        )

      }

      await user.save()
      await trx.commit()

      return {
        success:true,
        message:"Administrateur modifié avec succès.",
        data:user

      }

    } catch(error){
      await trx.rollback()
      throw error

    }

  }




  /**
   * ============================================================================
   * Suspendre un administrateur
   * ============================================================================
   */
  async suspend(id:number){
    const user = await User.find(id)

    if(!user){
      throw new Error("Administrateur introuvable.")

    }

    user.statut = 'INACTIF'
    await user.save()

    await EcoleUser.query().where('user_id',id).update({statut:'INACTIF'})

    return {
      success:true,
      message: "Administrateur suspendu."
    }

  }




  /**
   * ============================================================================
   * Réactiver un administrateur
   * ============================================================================
   */
  async activate(id:number){
    const user = await User.find(id)

    if(!user){
      throw new Error(
        "Administrateur introuvable."
      )

    }

    user.statut = 'ACTIF'
    await user.save()

    await EcoleUser.query().where('user_id',id).update({
        statut:'ACTIF'
      })

    return {
      success:true,
      message: "Administrateur réactivé."
    }

  }

  /**
   * ============================================================================
   * Suppression logique
   * ============================================================================
   */
  async delete(id:number){
    const user = await User.find(id)

    if(!user){
      throw new Error("Administrateur introuvable.")
    }

    user.statut='INACTIF'
    await user.save()

    await EcoleUser.query().where('user_id',id).update({
        statut:'INACTIF'
      })

    return {
      success:true,
      message: "Administrateur supprimé."

    }

  }

  /**
   * ============================================================================
   * Liste des administrateurs
   * ============================================================================
   */
  async findAll(
    page:number = 1,
    limit:number = 10,
    filters:any = {}
  ){


    const query = User.query().whereHas('ecoles',(builder)=>{
        builder
        .wherePivot('role', 'ADMIN_ECOLE')

      })
      .orderBy('created_at', 'desc')




    if(filters.search){
      query.where((builder)=>{
        builder.whereILike('nom', `%${filters.search}%`)
        .orWhereILike('prenom',`%${filters.search}%`
        )
        .orWhereILike(
          'email', `%${filters.search}%`
        )
      })

    }

    if(filters.statut){
      query.where('statut', filters.statut)
    }

    const result = await query.paginate(page, limit)

    return {
      success:true,
      data:result
    }

  }

  /**
   * ============================================================================
   * Administrateurs d'une école
   * ============================================================================
   */
  async getBySchool(ecoleId:number){

    const administrateurs =
      await User.query().whereHas('ecoles',
        (query)=>{
          query.where('ecole_id', ecoleId)
          .wherePivot('role', 'ADMIN_ECOLE')
        }
      )

    return {
      success:true,
      data:administrateurs
    }

  }

    /**
   * ============================================================================
   * Statistiques des administrateurs
   * ============================================================================
   */
  async statistics() {

    const total = await User.query().whereHas('ecoles', (query) => {
        query.wherePivot('role', 'ADMIN_ECOLE')
      }).count('* as total')

    const actifs = await User.query().whereHas('ecoles', (query) => {
        query.wherePivot('role', 'ADMIN_ECOLE')
      })
      .where('statut', 'ACTIF').count('* as total')

    const inactifs = await User.query().whereHas('ecoles', (query) => {
        query.wherePivot('role', 'ADMIN_ECOLE')
      })
      .where('statut', 'INACTIF').count('* as total')

    return {
      total:Number(total[0].$extras.total),
      actifs:Number(actifs[0].$extras.total),
      inactifs:Number(inactifs[0].$extras.total)
    }

  }




  /**
   * ============================================================================
   * Profil complet administrateur
   * ============================================================================
   */
  async details(id:number) {

    const administrateur = await User.query().where('id', id).preload('ecoles', (query)=>{
        query.pivotColumns(['role', 'statut'])}).first()

    if(!administrateur){
      throw new Error("Administrateur introuvable.")
    }

    return {
      success:true,
      data:administrateur
    }
  }

  /**
   * ============================================================================
   * Changer l'école principale d'un administrateur
   * ============================================================================
   */
  async switchSchool(userId:number, ecoleId:number){

    const context = await UserContext.query().where('user_id', userId).where('ecole_id', ecoleId).first()

    if(!context){
      throw new Error("Cet administrateur n'appartient pas à cette école.")
    }

    await UserContext.query().where('user_id',userId).update({active:false})
    context.active = true

    await context.save()

    return {
      success:true,
      message:"École active changée avec succès.",
      data:context
    }
  }

  /**
   * ============================================================================
   * Vérifier si un administrateur appartient à une école
   * ============================================================================
   */
  async belongsToSchool(userId:number, ecoleId:number){

    const association = await EcoleUser.query().where('user_id', userId).where('ecole_id', ecoleId).where('role', 'ADMIN_ECOLE').first()
    return !!association

  }

  /**
   * ============================================================================
   * Supprimer définitivement un administrateur
   * (à utiliser uniquement en cas exceptionnel)
   * ============================================================================
   */
  async forceDelete(id:number){

    const trx = await db.transaction()

    try {
      await EcoleUser.query({client:trx}).where('user_id', id).delete()
      await UserContext.query({client:trx}).where('user_id', id).delete()

      const user = await User.findOrFail(id)
      await user.useTransaction(trx).delete()
      await trx.commit()

      return {
        success:true,
        message:"Administrateur supprimé définitivement."

      }
    }
    catch(error){
      await trx.rollback()
      throw error
    }

  }

  /**
   * ============================================================================
   * Vérifier email unique
   * ============================================================================
   */
  private async validateEmail(email:string) {

    const user = await User.findBy('email', email)

    if(user){
      throw new Error("Cette adresse email existe déjà.")

    }

  }

  /**
   * ============================================================================
   * Vérifier téléphone unique
   * ============================================================================
   */
  private async validateTelephone(telephone:string) {

    const user = await User.findBy('telephone', telephone)

    if(user){
      throw new Error("Ce numéro de téléphone existe déjà.")
    }

  }

}