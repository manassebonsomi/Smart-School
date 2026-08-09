import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {

  protected tableName = 'access_tokens'

  async up() {

    this.schema.createTable(this.tableName, (table) => {

      table.bigIncrements('id')      
      table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.bigInteger('ecole_id').unsigned().notNullable().references('id').inTable('ecoles').onDelete('CASCADE')
      table.string('role', 50).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['user_id'])
      table.index(['ecole_id'])
    })

  }

  async down() {
    this.schema.dropTable(this.tableName)
  }

}