import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Niveau from './niveau.ts'
import Classe from './classe.ts'
import Matiere from './matiere.ts'
import Eleve from './eleve.ts'
import Devoir from './devoir.ts'
import Exercice from './exercice.ts'
import Communique from './communique.ts'
import User from './user.ts'
import UserContext from './user_context.ts'
export default class Ecole extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare nom: string
  @column()
  declare code: string
  @column()
  declare description: string | null
  @column()
  declare adresse: string | null
  @column()
  declare telephone: string | null
  @column()
  declare email: string | null
  @column()
  declare ville: string | null
  @column()
  declare pays: string | null
  @column()
  declare province: string | null
  @column()
  declare commune: string | null
  @column()
  declare quartier: string | null
  @column({ columnName: 'site_web' })
  declare siteWeb: string | null
  @column()
  declare type: string | null
  @column({ columnName: 'annee_creation' })
  declare anneeCreation: number | null
  @column()
  declare logo: string | null
  @column()
  declare statut: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  @hasMany(() => Niveau)
  declare niveaux: HasMany<typeof Niveau>
  @hasMany(() => Classe)
  declare classes: HasMany<typeof Classe>
  @hasMany(() => Matiere)
  declare matieres: HasMany<typeof Matiere>
  @hasMany(() => Eleve)
  declare eleves: HasMany<typeof Eleve>
  @hasMany(() => Devoir)
  declare devoirs: HasMany<typeof Devoir>
  @hasMany(() => Exercice)
  declare exercices: HasMany<typeof Exercice>
  @hasMany(() => Communique)
  declare communiques: HasMany<typeof Communique>
  @manyToMany(() => User, { pivotTable: 'ecole_users', pivotColumns: ['role', 'statut'] })
  declare utilisateurs: ManyToMany<typeof User>
  @hasMany(() => UserContext)
  declare contextes: HasMany<typeof UserContext>
}
