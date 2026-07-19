import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'communiques'

  async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.bigIncrements('id')
      table.bigInteger('ecole_id').unsigned().notNullable().references('id').inTable('ecoles').onDelete('CASCADE')
      table.bigInteger('auteur_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('titre', 255).notNullable()
      table.text('contenu').notNullable()
      table.string('fichier', 500).nullable()
      table.enum('cible', ['TOUS', 'ENSEIGNANTS', 'PARENTS', 'ELEVES']).defaultTo('TOUS')
      table.timestamp('date_publication', { useTz: true }).defaultTo(this.now())
      table.enum('statut', ['BROUILLON', 'PUBLIE', 'ARCHIVE']).defaultTo('BROUILLON')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['ecole_id'])
      table.index(['auteur_id'])
      table.index(['cible'])
      table.index(['statut'])
      table.index(['date_publication'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}