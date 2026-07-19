import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Ecole from './ecole.ts'
import Niveau from './niveau.ts'
import Eleve from './eleve.ts'
import Devoir from './devoir.ts'
import Exercice from './exercice.ts'


export default class Classe extends BaseModel {

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ecoleId: number

  @column()
  declare niveauId: number

  @column()
  declare nom: string

  @column()
  declare anneeScolaire: string

  @column()
  declare statut: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Ecole)
  declare ecole: BelongsTo<typeof Ecole>

  @belongsTo(() => Niveau)
  declare niveau: BelongsTo<typeof Niveau>

  @hasMany(() => Eleve)
  declare eleves: HasMany<typeof Eleve>

  @hasMany(() => Devoir)
  declare devoirs: HasMany<typeof Devoir>

  @hasMany(() => Exercice)
  declare exercices: HasMany<typeof Exercice>

}