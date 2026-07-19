import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecole_users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.bigIncrements('id')
      table.bigInteger('ecole_id').unsigned().notNullable().references('id').inTable('ecoles').onDelete('CASCADE')
      table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.enum('role', ['ADMINISTRATEUR', 'DIRECTEUR', 'ENSEIGNANT', 'PARENT', 'ELEVE']).notNullable()
      table.enum('statut', ['ACTIF', 'INACTIF']).defaultTo('ACTIF')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['ecole_id', 'user_id', 'role'])
    })
  }


  async down() {
    this.schema.dropTable(this.tableName)
  }
}