import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ecole from './ecole.ts'
import User from './user.ts'


export default class EcoleUser extends BaseModel {

  public static table = 'ecole_users'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ecoleId: number

  @column()
  declare userId: number

  @column()
  declare role: string

  @column()
  declare statut: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Ecole)
  declare ecole: BelongsTo<typeof Ecole>

  @belongsTo(() => User)
  declare utilisateur: BelongsTo<typeof User>

}