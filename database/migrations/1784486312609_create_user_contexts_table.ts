import { BaseSchema } from '@adonisjs/lucid/schema'


export default class extends BaseSchema {

  protected tableName = 'user_contexts'


  async up() {

    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.bigInteger('ecole_id').unsigned().notNullable().references('id').inTable('ecoles').onDelete('CASCADE')
      table.boolean('active').defaultTo(true)
      table.timestamp('created_at', { useTz:true }).notNullable()
      table.timestamp('updated_at', { useTz:true }).notNullable()
      table.unique(['user_id','ecole_id'])
    })

  }


  async down() {
    this.schema.dropTable(this.tableName)
  }

}