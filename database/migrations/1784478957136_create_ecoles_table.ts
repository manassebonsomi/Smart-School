import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  protected tableName = 'ecoles'
  async up() {
    this.schema.createTable(this.tableName, table => {
      table.bigIncrements('id')
      table.string('nom', 255).notNullable()
      table.string('code', 50).notNullable().unique()
      table.text('description').nullable()
      table.string('email', 255).nullable()
      table.string('telephone', 30).nullable()
      table.string('adresse', 255).nullable()
      table.string('ville', 100).nullable()
      table.string('pays', 100).defaultTo('République démocratique du Congo')
      table.string('province', 100).nullable()
      table.string('commune', 100).nullable()
      table.string('quartier', 100).nullable()
      table.string('site_web', 255).nullable()
      table.string('type', 100).nullable()
      table.integer('annee_creation').nullable()
      table.string('logo', 500).nullable()
      table.string('statut', 20).notNullable().defaultTo('ACTIF')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['statut'])
      table.index(['ville'])
      table.index(['province'])
    })
  }
  async down() { this.schema.dropTable(this.tableName) }
}
