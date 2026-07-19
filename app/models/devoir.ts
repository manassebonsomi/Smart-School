import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Ecole from './ecole.ts'
import User from './user.ts'
import Classe from './classe.ts'
import Matiere from './matiere.ts'
import Eleve from './eleve.ts'


export default class Devoir extends BaseModel {

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ecoleId: number

  @column()
  declare enseignantId: number

  @column()
  declare classeId: number

  @column()
  declare matiereId: number

  @column()
  declare titre: string

  @column()
  declare description: string | null

  @column()
  declare fichier: string | null

  @column.dateTime()
  declare datePublication: DateTime

  @column.dateTime()
  declare dateLimite: DateTime | null

  @column()
  declare statut: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Ecole)
  declare ecole: BelongsTo<typeof Ecole>

  @belongsTo(() => User, {
    foreignKey: 'enseignantId'
  })
  declare enseignant: BelongsTo<typeof User>

  @belongsTo(() => Classe)
  declare classe: BelongsTo<typeof Classe>

  @belongsTo(() => Matiere)
  declare matiere: BelongsTo<typeof Matiere>

  @manyToMany(() => Eleve, {
    pivotTable: 'devoir_eleves',
    pivotColumns: ['statut', 'dateLecture']
  })
  declare eleves: ManyToMany<typeof Eleve>

}