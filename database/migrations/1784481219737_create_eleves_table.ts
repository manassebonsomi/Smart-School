import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {

  protected tableName = 'eleves'


  async up() {

    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.bigInteger('ecole_id').unsigned().notNullable().references('id').inTable('ecoles').onDelete('CASCADE')
      table.bigInteger('classe_id').unsigned().notNullable().references('id').inTable('classes').onDelete('CASCADE')
      table.string('matricule', 50).notNullable()
      table.date('date_naissance').nullable()
      table.enum('sexe', ['MASCULIN','FEMININ']).nullable()
      table.string('photo',500).nullable()
      table.enum('statut',['ACTIF','INACTIF','TRANSFERE','SORTI']).defaultTo('ACTIF')
      table.timestamp('created_at',{useTz:true}).notNullable()
      table.timestamp('updated_at',{useTz:true}).notNullable()
      table.index(['ecole_id'])
      table.index(['classe_id'])
      table.unique(['ecole_id','matricule'])

    })

  }


  async down(){

    this.schema.dropTable(this.tableName)

  }

}