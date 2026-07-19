import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'devoirs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.bigIncrements('id')
      table.bigInteger('ecole_id').unsigned().notNullable().references('id').inTable('ecoles').onDelete('CASCADE')
      table.bigInteger('enseignant_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.bigInteger('classe_id').unsigned().notNullable().references('id').inTable('classes').onDelete('CASCADE')
      table.bigInteger('matiere_id').unsigned().notNullable().references('id').inTable('matieres').onDelete('CASCADE')
      table.string('titre', 255).notNullable()
      table.text('description').nullable()
      table.string('fichier', 500).nullable()
      table.timestamp('date_publication', { useTz: true }).defaultTo(this.now())
      table.timestamp('date_limite', { useTz: true }).nullable()
      table.enum('statut', ['BROUILLON', 'PUBLIE', 'FERME']).defaultTo('BROUILLON')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['ecole_id'])
      table.index(['enseignant_id'])
      table.index(['classe_id'])
      table.index(['matiere_id'])
      table.index(['statut'])
    })
  }


  async down() {
    this.schema.dropTable(this.tableName)
  }
}