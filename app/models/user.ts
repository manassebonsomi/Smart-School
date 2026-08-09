import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import Communique from './communique.ts'
import Exercice from './exercice.ts'
import Devoir from './devoir.ts'
import Ecole from './ecole.ts'
import Eleve from './eleve.ts'
import UserContext from './user_context.ts'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import { SystemRole } from '../enums/system_role.ts'


const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  // public static table = 'users'
  public static accessTokens = DbAccessTokensProvider.forModel(User)

  declare currentAccessToken?: AccessToken

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nom: string

  @column()
  declare postnom: string

  @column()
  declare prenom: string

  @column()
  declare pseudo: string | null

  @column()
  declare email: string

  @column()
  declare telephone: string | null

  @column()
  declare sexe: string | null

  @column()
  declare bio: string | null

  @column()
  declare address: string | null

  @column({ columnName: 'avatar_url' })
  declare avatarUrl: string | null

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare statut: string

  @column({ columnName: 'system_role' })
  declare systemRole: SystemRole

  @column()
  declare isVerified: boolean

  @column()
  declare token_verification: string | null

  @column.dateTime({ columnName: 'token_verification_expires_at' })
  declare tokenVerificationExpiresAt: DateTime | null

  @column()
  declare twoFactorCode: string | null

  @column.dateTime()
  declare twoFactorExpiresAt: DateTime | null

  @column()
  declare resetPasswordToken: string | null

  @column.dateTime()
  declare resetPasswordExpiresAt: DateTime | null

  @column()
  declare googleId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare lastLoginAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @manyToMany(() => Ecole, {
    pivotTable: 'ecole_users',
    pivotColumns: ['role', 'statut']
  })
  declare ecoles: ManyToMany<typeof Ecole>

  @hasMany(() => Devoir, {
    foreignKey: 'enseignantId'
  })
  declare devoirs: HasMany<typeof Devoir>

  @hasMany(() => Exercice, {
    foreignKey: 'enseignantId'
  })
  declare exercices: HasMany<typeof Exercice>

  @hasMany(() => Communique, {
    foreignKey: 'auteurId'
  })
  declare communiques: HasMany<typeof Communique>

  @hasOne(() => Eleve)
  declare eleve: HasOne<typeof Eleve>

  @manyToMany(() => Eleve, {
    pivotTable: 'parent_eleves',
    pivotColumns: ['relation']
  })
  declare enfants: ManyToMany<typeof Eleve>

  @hasOne(() => UserContext)
  declare contexte: HasOne<typeof UserContext>
  
}
