import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'devoir_eleves'

  async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.bigIncrements('id')
      table.bigInteger('devoir_id').unsigned().notNullable().references('id').inTable('devoirs').onDelete('CASCADE')
      table.bigInteger('eleve_id').unsigned().notNullable().references('id').inTable('eleves').onDelete('CASCADE')
      table.enum('statut', ['NON_LU', 'LU']).defaultTo('NON_LU')
      table.timestamp('date_lecture', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['devoir_id', 'eleve_id'])
      table.index(['devoir_id'])
      table.index(['eleve_id'])
    })
  }


  async down() {
    this.schema.dropTable(this.tableName)
  }
}