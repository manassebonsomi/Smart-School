import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('nom', 100).notNullable()
      table.string('postnom',100).nullable()
      table.string('prenom', 100).notNullable()
      table.string('pseudo', 50).unique().nullable()
      table.string('email', 150).notNullable().unique()
      table.string('telephone', 20).unique().nullable()
      table.string('bio', 200).nullable()
      table.text('address').nullable()
      table.string('avatar_url').nullable()
      table.text('password').nullable()
      table.enum('sexe', ['HOMME', 'FEMME']).nullable()
      table.enum('statut', ['ACTIF', 'INACTIF', 'BLOQUE', 'EN ATTENTE', 'SUPPRIME']).defaultTo('ACTIF')
      table.boolean('is_verified').defaultTo(false)
      table.string('token_verification').nullable()
      table.timestamp('token_verification_expires_at').nullable()
      table.string('two_factor_code').nullable()
      table.dateTime('two_factor_expires_at').nullable()
      table.string('reset_password_token').nullable()
      table.timestamp('reset_password_expires_at').nullable()
      table.string('google_id').nullable().unique()
      table.timestamp('last_login_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
      table.index(['email'])
      table.index(['telephone'])
      table.index(['statut'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
