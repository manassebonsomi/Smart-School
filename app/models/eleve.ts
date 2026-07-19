import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Ecole from './ecole.ts'
import Classe from './classe.ts'
import Devoir from './devoir.ts'
import User from './user.ts'


export default class Eleve extends BaseModel {

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ecoleId: number

  @column()
  declare classeId: number

  @column()
  declare nom: string

  @column()
  declare prenom: string

  @column()
  declare dateNaissance: DateTime | null

  @column()
  declare sexe: string | null

  @column()
  declare matricule: string

  @column()
  declare photo: string | null

  @column()
  declare statut: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Ecole)
  declare ecole: BelongsTo<typeof Ecole>

  @belongsTo(() => Classe)
  declare classe: BelongsTo<typeof Classe>

  @manyToMany(() => Devoir, {
    pivotTable: 'devoir_eleves',
    pivotColumns: ['statut', 'dateLecture']
  })
  declare devoirs: ManyToMany<typeof Devoir>

  @belongsTo(() => User)
  declare utilisateur: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'parent_eleves',
    pivotColumns: ['relation']
  })
  declare parents: ManyToMany<typeof User>

}