import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Ecole from './ecole.ts'
import Devoir from './devoir.ts'
import Exercice from './exercice.ts'


export default class Matiere extends BaseModel {

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ecoleId: number

  @column()
  declare nom: string

  @column()
  declare description: string | null

  @column()
  declare statut: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Ecole)
  declare ecole: BelongsTo<typeof Ecole>

  @hasMany(() => Devoir)
  declare devoirs: HasMany<typeof Devoir>

  @hasMany(() => Exercice)
  declare exercices: HasMany<typeof Exercice>

}