import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'classes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.bigIncrements('id')
      table.bigInteger('ecole_id').unsigned().notNullable().references('id').inTable('ecoles').onDelete('CASCADE')
      table.bigInteger('niveau_id').unsigned().notNullable().references('id').inTable('niveaux').onDelete('CASCADE')
      table.string('nom', 100).notNullable()
      table.string('annee_scolaire', 20).notNullable()
      table.enum('statut', ['ACTIVE', 'INACTIVE']).defaultTo('ACTIVE')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['ecole_id'])
      table.index(['niveau_id'])
      table.unique(['ecole_id', 'nom', 'annee_scolaire'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}