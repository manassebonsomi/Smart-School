import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {

  protected tableName = 'parent_eleves'


  async up() {

    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('parent_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.bigInteger('eleve_id').unsigned().notNullable().references('id').inTable('eleves').onDelete('CASCADE')
      table.enum('relation', ['PERE','MERE','TUTEUR','AUTRE']).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['parent_id','eleve_id'])
    })

  }


  async down() {

    this.schema.dropTable(this.tableName)

  }

}