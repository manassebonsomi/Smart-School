import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  async up() {
    await this.schema.raw(`ALTER TABLE ecoles DROP CONSTRAINT IF EXISTS ecoles_statut_check`)
    await this.schema.raw(`ALTER TABLE ecoles DROP CONSTRAINT IF EXISTS ecoles_statut_enum_check`)
    await this.schema.raw(`ALTER TABLE ecoles ALTER COLUMN statut DROP DEFAULT`)
    await this.schema.raw(`ALTER TABLE ecoles ALTER COLUMN statut TYPE VARCHAR(20) USING statut::text`)
    await this.schema.raw(`UPDATE ecoles SET statut = CASE WHEN statut = 'ACTIVE' THEN 'ACTIF' WHEN statut = 'INACTIVE' THEN 'SUSPENDU' ELSE statut END`)
    await this.schema.raw(`ALTER TABLE ecoles ALTER COLUMN statut SET DEFAULT 'ACTIF'`)
    await this.schema.raw(`ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS province VARCHAR(100)`)
    await this.schema.raw(`ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS commune VARCHAR(100)`)
    await this.schema.raw(`ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS quartier VARCHAR(100)`)
    await this.schema.raw(`ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS site_web VARCHAR(255)`)
    await this.schema.raw(`ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS type VARCHAR(100)`)
    await this.schema.raw(`ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS annee_creation INTEGER`)
  }
  async down() {}
}
