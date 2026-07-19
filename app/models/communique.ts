import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ecole from './ecole.ts'
import User from './user.ts'


export default class Communique extends BaseModel {

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ecoleId: number

  @column()
  declare auteurId: number

  @column()
  declare titre: string

  @column()
  declare contenu: string

  @column()
  declare fichier: string | null

  @column()
  declare cible: string

  @column.dateTime()
  declare datePublication: DateTime

  @column()
  declare statut: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Ecole)
  declare ecole: BelongsTo<typeof Ecole>

  @belongsTo(() => User, {
    foreignKey: 'auteurId'
  })
  declare auteur: BelongsTo<typeof User>

}