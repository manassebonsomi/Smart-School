import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'niveaux'

  async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.bigIncrements('id')
      table.bigInteger('ecole_id').unsigned().notNullable().references('id').inTable('ecoles').onDelete('CASCADE')
      table.string('nom', 100).notNullable()
      table.text('description').nullable()
      table.enum('statut', ['ACTIF', 'INACTIF']).defaultTo('ACTIF')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['ecole_id'])
      table.unique(['ecole_id', 'nom'])
    })
  }


  async down() {
    this.schema.dropTable(this.tableName)
  }
}