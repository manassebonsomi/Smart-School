import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Devoir from './devoir.ts'
import Eleve from './eleve.ts'


export default class DevoirEleve extends BaseModel {

  public static table = 'devoir_eleves'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare devoirId: number

  @column()
  declare eleveId: number

  @column()
  declare statut: string

  @column.dateTime()
  declare dateLecture: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Devoir)
  declare devoir: BelongsTo<typeof Devoir>

  @belongsTo(() => Eleve)
  declare eleve: BelongsTo<typeof Eleve>

}